document.addEventListener("DOMContentLoaded", function () {
    const graphContainer = document.getElementById("graph-container");
    const algoButtons = document.querySelectorAll(".algo");
    const datasetButtons = document.querySelectorAll(".dataset");

    let currentAlgo = "louvain"; 
    let currentDataset = "strike"; 

    function fetchAndRenderGraph() {
        const filePath = `https://ekmpa.github.io/Network-Science/public/data/${currentDataset}_${currentAlgo}.json`;

        fetch(filePath)
            .then(response => response.json())
            .then(data => {
                processGraphData(data);
                updateActiveButtons();
            })
            .catch(error => console.error("Error fetching graph data:", error));
    }

    function processGraphData(graphData) {
        const nodeMap = new Map(graphData.nodes.map(node => [node.id, node]));

        const links = graphData.edges.map(edge => ({
            source: nodeMap.get(edge.from),
            target: nodeMap.get(edge.to)
        }));

        if (links.some(link => !link.source || !link.target)) {
            console.error("Error: Some edges reference undefined nodes", links);
            return;
        }

        renderGraph(graphData.nodes, links);
    }

    function renderGraph(nodes, links) {
        d3.select("#graph-container").html("");

        const width = 600, height = 250;
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const svg = d3.select("#graph-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(10))
            .force("charge", d3.forceManyBody().strength(-30))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1.2);

        const node = svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", 6)
            .attr("fill", d => color(d.group))
            .call(drag(simulation));

        const label = svg.selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("dy", 3)
            .attr("x", 8)
            .style("font-size", "8px")
            .text(d => d.id);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);

            label.attr("x", d => d.x + 6)
                .attr("y", d => d.y + 4);
        });
    }

    function drag(simulation) {
        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded);
    }

    function updateActiveButtons() {
        algoButtons.forEach(button => {
            button.classList.toggle("active", button.getAttribute("data-algo") === currentAlgo);
        });

        datasetButtons.forEach(button => {
            button.classList.toggle("active", button.getAttribute("data-dataset") === currentDataset);
        });
    }

    algoButtons.forEach(button => {
        button.addEventListener("click", function () {
            const algo = this.getAttribute("data-algo");
            if (algo !== currentAlgo) {
                currentAlgo = algo;
                fetchAndRenderGraph();
            }
        });
    });

    datasetButtons.forEach(button => {
        button.addEventListener("click", function () {
            const dataset = this.getAttribute("data-dataset");
            if (dataset !== currentDataset) {
                currentDataset = dataset;
                fetchAndRenderGraph();
            }
        });
    });

    fetchAndRenderGraph();
});