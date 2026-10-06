export default class GraphClass {
	constructor() {
		this.graph = {
			nodes: [],
			edges: [],
			nodeDegrees: {},
		};
	}

	computeAverageNodeDegree() {
		let degreeSum = 0;
		const degrees = Object.values(this.graph.nodeDegrees);
		for (const degree of degrees) {
			degreeSum += degree;
		}
		return degreeSum / degrees.length;
	}

	DFS(id, visited, curComponent) {
		visited[id] = true;
		curComponent.graph.nodes.push(
			this.graph.nodes.find((node) => node.id === id)
		);
		curComponent.graph.nodeDegrees[id] = 0;
		let edges = this.graph.edges.filter((edge) => edge.source.id === id);
		for (const edge of edges) {
			if (!visited[edge.target.id]) {
				curComponent.graph.edges.push(
					this.graph.edges.find(
						(findEdge) =>
							findEdge.source.id === id && findEdge.target.id === edge.target.id
					)
				);
				curComponent.graph.nodeDegrees[id]++;
				curComponent.graph.nodeDegrees[edge.target.id];
				curComponent = this.DFS(edge.target.id, visited, curComponent);
			}
		}
		edges = this.graph.edges.filter((edge) => edge.target.id === id);
		for (const edge of edges) {
			if (!visited[edge.source.id]) {
				curComponent.graph.edges.push(
					this.graph.edges.find(
						(findEdge) =>
							findEdge.source.id === edge.source.id && findEdge.target.id === id
					)
				);
				curComponent.graph.nodeDegrees[edge.source.id]++;
				curComponent.graph.nodeDegrees[id];
				curComponent = this.DFS(edge.source.id, visited, curComponent);
			}
		}
		return curComponent;
	}

	testDFS(id, visited, curComponent) {
		visited[id] = true;
		curComponent.graph.nodes.push(
			this.graph.nodes.find((node) => node.id === id)
		);
		curComponent.graph.nodeDegrees[id] = 0;
		for (const edge of this.graph.edges.filter((edge) => edge.source === id)) {
			if (!visited[edge.target]) {
				curComponent.graph.edges.push(
					this.graph.edges.find(
						(findEdge) =>
							findEdge.source === id && findEdge.target === edge.target
					)
				);
				curComponent.graph.nodeDegrees[id]++;
				curComponent.graph.nodeDegrees[edge.target];
				curComponent = this.testDFS(edge.target, visited, curComponent);
			}
		}
		for (const edge of this.graph.edges.filter((edge) => edge.target === id)) {
			if (!visited[edge.source]) {
				curComponent.graph.edges.push(
					this.graph.edges.find(
						(findEdge) =>
							findEdge.source === edge.source && findEdge.target === id
					)
				);
				curComponent.graph.nodeDegrees[edge.source]++;
				curComponent.graph.nodeDegrees[id];
				curComponent = this.testDFS(edge.source, visited, curComponent);
			}
		}
		return curComponent;
	}

	computeConnectedComponents() {
		const visited = new Object();
		for (const node of this.graph.nodes) {
			visited[node.id] = false;
		}
		let numComponents = 0;
		for (const node of this.graph.nodes) {
			if (!visited[node.id]) {
				this.DFS(node.id, visited, new GraphClass());
				numComponents++;
			}
		}
		return numComponents;
	}

	computeGraphDensity() {
		const e = this.graph.edges.length;
		const v = this.graph.nodes.length;
		return (2 * e) / (v * (v - 1));
	}

	findLargestConnectedComponent(test = true) {
		const visited = new Object();
		for (const node of this.graph.nodes) {
			visited[node.id] = false;
		}
		let components = [new GraphClass()];
		for (const node of this.graph.nodes) {
			if (!visited[node.id]) {
				components.push(
					test
						? this.testDFS(node.id, visited, new GraphClass())
						: this.DFS(node.id, visited, new GraphClass())
				);
			}
		}
		return components.reduce((prev, cur) =>
			prev.graph.nodes.length > cur.graph.nodes.length ? prev : cur
		).graph;
	}

	BFS(sourceID, targetID, testedPaths, maxPath) {
		const queue = [];
		const visited = new Set([sourceID]);
		queue.push(sourceID);
		let pathLen = 0;
		while (queue.length > 0) {
			const ID = queue[0];
			queue.shift();
			pathLen++;
			for (const edge of this.graph.edges.filter(
				(edge) => edge.source.id === ID
			)) {
				if (!visited.has(edge.target.id)) {
					testedPaths.add(`${sourceID},${edge.target}`);
					if (pathLen > maxPath) {
						maxPath = pathLen;
					}
					if (edge.target.id === targetID) {
						return pathLen;
					}
					queue.push(edge.target.id);
					visited.add(edge.target.id);
				}
			}
			for (const edge of this.graph.edges.filter(
				(edge) => edge.target.id === ID
			)) {
				if (!visited.has(edge.source.id)) {
					testedPaths.add(`${sourceID},${edge.source}`);
					if (pathLen > maxPath) {
						maxPath = pathLen;
					}
					if (edge.source.id === targetID) {
						return pathLen;
					}
					queue.push(edge.source.id);
					visited.add(edge.source.id);
				}
			}
		}
		return maxPath;
	}

	testBFS(sourceID, targetID, testedPaths, maxPath) {
		const queue = [];
		const visited = new Set([sourceID]);
		queue.push(sourceID);
		let pathLen = 0;
		while (queue.length > 0) {
			const ID = queue[0];
			queue.shift();
			pathLen++;
			for (const edge of this.graph.edges.filter(
				(edge) => edge.source === ID
			)) {
				if (!visited.has(edge.target)) {
					testedPaths.add(`${sourceID},${edge.target}`);
					if (pathLen > maxPath) {
						maxPath = pathLen;
					}
					if (edge.target === targetID) {
						return maxPath;
					}
					queue.push(edge.target);
					visited.add(edge.target);
				}
			}
			for (const edge of this.graph.edges.filter(
				(edge) => edge.target === ID
			)) {
				if (!visited.has(edge.source)) {
					testedPaths.add(`${sourceID},${edge.source}`);
					if (pathLen > maxPath) {
						maxPath = pathLen;
					}
					if (edge.source === targetID) {
						return maxPath;
					}
					queue.push(edge.source);
					visited.add(edge.source);
				}
			}
		}
		return maxPath;
	}

	findGraphDiameter(test = true) {
		const testedPaths = new Set();
		let maxPath = 0;
		for (const sourceNode of this.graph.nodes) {
			for (const targetNode of this.graph.nodes) {
				if (
					!(
						sourceNode === targetNode ||
						testedPaths.has([sourceNode.id, targetNode.id].join(",")) ||
						testedPaths.has([targetNode.id, sourceNode.id].join(","))
					)
				) {
					maxPath = test
						? this.testBFS(sourceNode.id, targetNode.id, testedPaths, maxPath)
						: this.BFS(sourceNode.id, targetNode.id, testedPaths, maxPath);
					testedPaths.add(`${sourceNode.id},${targetNode.id}`);
					testedPaths.add(`${targetNode.id},${sourceNode.id}`);
				}
			}
		}
		return maxPath;
	}
}
