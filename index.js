import GraphClass from "./GraphClass.js";

let mouseX,
	mouseY = 0;
let clickedID;
let graph;
let link;
let simulation;
let clickedIDs = [];

const dimensions = {
	width: window.innerWidth - 112,
	height: window.innerHeight,
	margins: 75,
	radius: 5,
	hoverFactor: 2,
};

let layout = "force";
let subgraph = false;
let svg;

function edgeExists(sourceID, targetID) {
	for (const edge of graph.graph.edges) {
		if (
			(edge.source.id === sourceID && edge.target.id === targetID) ||
			(edge.source.id === targetID && edge.target.id === sourceID)
		) {
			return true;
		}
	}
	return false;
}

function handleNodeClick(d, i) {
	if (clickedIDs.length === 0) {
		clickedID = i.id;
	}
	if (clickedIDs.length === 0 || i.id != clickedIDs[0]) {
		clickedIDs.push(i.id);
	} else if (clickedIDs.length === 1 && i.id === clickedIDs[0]) {
		alert("No self loops!");
		clickedIDs = [];
	}
	if (clickedIDs.length > 1) {
		if (!edgeExists(clickedIDs[0], clickedIDs[1])) {
			simulation.stop();
			graph.graph.nodes.find((node) => node.id === clickedIDs[0]).degree++;
			graph.graph.nodes.find((node) => node.id === clickedIDs[1]).degree++;
			graph.graph.edges.push({
				source: clickedIDs[0],
				target: clickedIDs[1],
			});
			graph.graph.nodeDegrees[clickedIDs[0]] += 1;
			graph.graph.nodeDegrees[clickedIDs[1]] += 1;
			displayGraph(true);
		} else {
			alert("Edge already exists!");
		}
		clickedIDs = [];
	}
}

let outerRadius, innerRadius;
let outerInterval, innerInterval;
let outerAngle, innerAngle;
let coords;

function setupRadial() {
	outerRadius =
		Math.min(dimensions.width, dimensions.height) / 2 - 2 * dimensions.radius;
	outerInterval =
		360 / graph.graph.nodes.filter((node) => node.degree === 0).length;
	outerAngle = 0;
	innerRadius = outerRadius * (3 / 4);
	innerInterval =
		360 / graph.graph.nodes.filter((node) => node.degree > 0).length;
	innerAngle = 0;

	coords = {};
	for (const node of graph.graph.nodes) {
		const radius = node.degree === 0 ? outerRadius : innerRadius;
		if (node.degree === 0) {
			outerAngle += outerInterval;
		} else {
			innerAngle += innerInterval;
		}
		const angle = node.degree === 0 ? outerAngle : innerAngle;
		const coord = [];
		coord.push(
			dimensions.width / 2 + radius * Math.cos((angle * Math.PI) / 180)
		);
		coord.push(
			dimensions.height / 2 + radius * Math.sin((angle * Math.PI) / 180)
		);
		coords[node.id] = coord;
	}
}

function updateStatistics() {
	document.getElementById(
		"avg-node-degree"
	).innerHTML = `Average node degree - ~${graph
		.computeAverageNodeDegree()
		.toFixed(3)}`;
	document.getElementById(
		"num-connected-comps"
	).innerHTML = `Number of connected components - ${graph.computeConnectedComponents()}`;
	document.getElementById("graph-density").innerHTML = `Graph density - ~${graph
		.computeGraphDensity()
		.toFixed(5)}`;
	document.getElementById(
		"graph-diameter"
	).innerHTML = `Graph diameter - ${125}`;
}

// ── Movie Panel ────────────────────────────────────────────────────────────────

function showMoviePanel(node) {
	let panel = document.getElementById("movie-panel");
	if (!panel) {
		panel = document.createElement("div");
		panel.id = "movie-panel";
		document.getElementById("vis-container").appendChild(panel);
	}

	const topCast = node.cast_name
		? node.cast_name.split(",").slice(0, 4).join(", ")
		: "N/A";
	const genres = node.genre || "N/A";
	const rating = node.imdb_rating || "N/A";
	const votes = node.imbd_votes
		? parseInt(node.imbd_votes).toLocaleString()
		: "N/A";
	const duration = node.duration ? `${node.duration} min` : "N/A";
	const cert = node.certificate || "N/A";
	const director = node.director_name || "N/A";
	const writers = node.writter_name
		? node.writter_name.split(",").slice(0, 2).join(", ")
		: "N/A";

	panel.innerHTML = `
		<div class="mp-poster-wrap">
			<img
				class="mp-poster"
				src="${node.img_link || ""}"
				alt="${node.name}"
				onerror="this.parentElement.style.display='none'"
			/>
			${node.rank ? `<div class="mp-rank">#${node.rank}</div>` : ""}
		</div>
		<div class="mp-body">
			<div class="mp-title">${node.name}</div>
			<div class="mp-meta">${node.year} &nbsp;·&nbsp; ${cert} &nbsp;·&nbsp; ${duration}</div>
			<div class="mp-rating">
				<span class="mp-star">★</span>
				<span class="mp-score">${rating}</span>
				<span class="mp-votes">${votes} votes</span>
			</div>
			<div class="mp-divider"></div>
			<div class="mp-row"><span class="mp-key">Genre</span><span>${genres}</span></div>
			<div class="mp-row"><span class="mp-key">Director</span><span>${director}</span></div>
			<div class="mp-row"><span class="mp-key">Writers</span><span>${writers}</span></div>
			<div class="mp-row mp-cast"><span class="mp-key">Cast</span><span>${topCast}</span></div>
		</div>
	`;

	panel.classList.add("visible");
}

function hideMoviePanel() {
	const panel = document.getElementById("movie-panel");
	if (panel) panel.classList.remove("visible");
}

// ── Display Graph ──────────────────────────────────────────────────────────────

async function displayGraph(update) {
	if (update) {
		document.querySelector("#graph svg").remove();
	} else {
		const outputGraph = await d3.json(
			"http://localhost:3000/output_graph.json"
		);
		graph = new GraphClass();
		graph.graph = outputGraph;
	}

	svg = d3
		.select("#graph")
		.attr("width", "100%")
		.attr("height", "100%")
		.append("svg")
		.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
	d3.select("#vis-container").on("mousemove", (e) => {
		[mouseX, mouseY] = d3.pointer(e);
	});

	link = svg
		.selectAll("line")
		.data(graph.graph.edges)
		.enter()
		.append("line")
		.style("stroke", "black");

	const mouseLink = svg
		.append("line")
		.attr("id", "mouse-link")
		.style("stroke", "black")
		.style("stroke-dasharray", "5, 5");

	const color = d3.scaleLinear().domain([0, 19]).range(["black", "yellow"]);

	const node = svg
		.selectAll("circle")
		.data(graph.graph.nodes)
		.enter()
		.append("circle")
		.attr("r", dimensions.radius)
		.attr("fill", (d) => color(d.degree))
		.attr("cursor", "pointer")
		.attr("id", (d) => d.id)
		.on("click", handleNodeClick)
		.on("mouseover", function (d, i) {
			d3.selectAll(".label").remove();
			d3.selectAll("line")
				.transition()
				.duration("250")
				.attr("filter", "blur(2px)");
			d3.selectAll("circle")
				.transition()
				.duration("250")
				.attr("filter", "blur(2px)")
				.attr("r", dimensions.radius);
			d3.select(this)
				.transition()
				.duration("250")
				.attr("filter", "blur(0)")
				.attr("r", dimensions.radius * dimensions.hoverFactor);
			this.parentNode.appendChild(this);

			showMoviePanel(i);
		})
		.on("mouseout", () => {
			d3.selectAll("line")
				.transition()
				.duration("250")
				.attr("filter", "blur(0)");
			d3.selectAll("circle")
				.transition()
				.duration("250")
				.attr("filter", "blur(0)")
				.attr("r", dimensions.radius);
			d3.selectAll(".label").remove();
			hideMoviePanel();
		});

	const mouseNode = svg
		.append("circle")
		.attr("id", "mouse-node")
		.style("visibility", "hidden");

	node.call(
		d3.drag().on("start", dragstart).on("drag", drag).on("end", dragend)
	);

	function dragstart(e) {
		if (!e.active) simulation.alphaTarget(0.3).restart();
		e.subject.fx = e.subject.x;
		e.subject.fy = e.subject.y;
	}

	function drag(e) {
		e.subject.fx = e.x;
		e.subject.fy = e.y;
	}

	function dragend(e) {
		if (!e.active) simulation.alphaTarget(0);
		e.subject.fx = null;
		e.subject.fy = null;
	}

	if (layout === "radial") {
		setupRadial();
	}

	simulation = d3
		.forceSimulation(graph.graph.nodes)
		.force(
			"link",
			d3.forceLink(graph.graph.edges).id((d) => d.id)
		)
		.force("charge", d3.forceManyBody().strength(-50).distanceMax(100))
		.force(
			"center",
			d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
		)
		.on("tick", () => {
			link
				.attr("x1", (d) =>
					layout === "force" ? d.source.x : coords[d.source.id][0]
				)
				.attr("y1", (d) =>
					layout === "force" ? d.source.y : coords[d.source.id][1]
				)
				.attr("x2", (d) =>
					layout === "force" ? d.target.x : coords[d.target.id][0]
				)
				.attr("y2", (d) =>
					layout === "force" ? d.target.y : coords[d.target.id][1]
				);
			node
				.attr("cx", (d) =>
					layout === "force" ? d.x : coords[d.id] ? coords[d.id][0] : 0
				)
				.attr("cy", (d) =>
					layout === "force" ? d.y : coords[d.id] ? coords[d.id][1] : 0
				);
			mouseLink
				.attr("x1", () =>
					clickedIDs.length === 1 ? d3.select(`#${clickedID}`).attr("cx") : 0
				)
				.attr("y1", () =>
					clickedIDs.length === 1 ? d3.select(`#${clickedID}`).attr("cy") : 0
				)
				.attr("x2", () => mouseX)
				.attr("y2", () => mouseY)
				.style("visibility", clickedIDs.length === 1 ? "visible" : "hidden");
			mouseNode.attr("cx", mouseX).attr("cy", mouseY);
		});
	setTimeout(
		() =>
			setInterval(() => {
				simulation.alpha(0.02);
			}, 250),
		"2000"
	);

	updateStatistics();
}

displayGraph(false);

function toggleStatistics() {
	const statisticsContainer = document.getElementById("statistics-container");
	statisticsContainer.style.visibility =
		window
			.getComputedStyle(statisticsContainer)
			.getPropertyValue("visibility") === "hidden"
			? "visible"
			: "hidden";
}

document
	.getElementById("statistics-button")
	.addEventListener("click", toggleStatistics);

function swapLayout() {
	layout = layout === "force" ? "radial" : "force";
	displayGraph(true);
}

document
	.getElementById("swap-layout-button")
	.addEventListener("click", swapLayout);

function toggleAddNode() {
	document.getElementById("search-container").style.visibility = "hidden";
	const addNodeContainer = document.getElementById("add-node-container");
	addNodeContainer.style.visibility =
		window.getComputedStyle(addNodeContainer).getPropertyValue("visibility") ===
		"hidden"
			? "visible"
			: "hidden";
}

document
	.getElementById("add-node-button")
	.addEventListener("click", toggleAddNode);

document
	.getElementById("add-node-close")
	.addEventListener("click", toggleAddNode);

function addNode() {
	const node = {};

	node.degree = 0;
	node.id = `tt${
		Math.max(...graph.graph.nodes.map((node) => node.id.slice(2))) + 1
	}`;
	node.name = document.getElementById("name").value;
	node.new = true;
	node.year = document.getElementById("year").value;

	simulation.stop();
	graph.graph.nodes.push(node);
	graph.graph.nodeDegrees[node.id] = 0;

	displayGraph(true);
}

document.getElementById("add-node-submit").addEventListener("click", addNode);

function toggleSearch() {
	d3.selectAll("line").transition().duration("250").attr("filter", "blur(0)");
	d3.selectAll("circle")
		.transition()
		.duration("250")
		.attr("filter", "blur(0)")
		.attr("r", dimensions.radius);
	d3.selectAll(".label").remove();
	document.getElementById("add-node-container").style.visibility = "hidden";
	const searchContainer = document.getElementById("search-container");
	searchContainer.style.visibility =
		window.getComputedStyle(searchContainer).getPropertyValue("visibility") ===
		"hidden"
			? "visible"
			: "hidden";
}

document
	.getElementById("search-button")
	.addEventListener("click", toggleSearch);

document.getElementById("search-close").addEventListener("click", toggleSearch);

function search() {
	d3.selectAll("line").transition().duration("250").attr("filter", "blur(0)");
	d3.selectAll("circle")
		.transition()
		.duration("250")
		.attr("filter", "blur(0)")
		.attr("r", dimensions.radius);
	d3.selectAll(".label").remove();
	const id = document.getElementById("id").value;
	const query = `#graph #${id}`;
	const D3Node = d3.select(query);
	const HTMLNode = document.querySelector(query);
	const graphNode = graph.graph.nodes.find((node) => node.id === id);
	D3Node.transition()
		.duration("250")
		.attr("r", dimensions.radius * dimensions.hoverFactor);
	document
		.querySelector(query)
		.parentNode.appendChild(document.querySelector(query));
	d3.select(HTMLNode.parentNode)
		.append("text")
		.attr("x", () => HTMLNode.getAttribute("cx"))
		.attr("y", () => HTMLNode.getAttribute("cy"))
		.attr("color", "yellow")
		.attr("font-size", "2rem")
		.attr("class", "label")
		.text(() => `${graphNode.name} (${graphNode.year})`);
	d3.selectAll("line").transition().duration("250").attr("filter", "blur(2px)");
	d3.selectAll("circle")
		.transition()
		.duration("250")
		.attr("filter", "blur(2px)")
		.attr("r", dimensions.radius);
	d3.select(document.querySelector(query))
		.transition()
		.duration("250")
		.attr("filter", "blur(0)")
		.attr("r", dimensions.radius * dimensions.hoverFactor);
}

document.getElementById("search-submit").addEventListener("click", search);

async function toggleSubgraph() {
	simulation.stop();
	if (!subgraph) {
		graph.graph = graph.findLargestConnectedComponent(false);
		console.log(graph.graph);
	} else {
		graph.graph = await d3.json("http://localhost:3000/output_graph.json");
	}
	setupRadial();
	subgraph = subgraph === true ? false : true;
	displayGraph(true);
}

document
	.getElementById("subgraph-button")
	.addEventListener("click", toggleSubgraph);