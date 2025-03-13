document.addEventListener("DOMContentLoaded", function () {
    const algoButtons = document.querySelectorAll(".algo");
    const datasetButtons = document.querySelectorAll(".dataset");
    const dataLapButtons = document.querySelectorAll(".dataset-lap");

    let currentAlgo = "louvain"; 
    let currentDataset = "strike"; 

    // const graphContainer = document.getElementById("graph-container");

    //const datasetButtonsLaplacian = document.querySelectorAll(".dataset");
    let currDataLaplacian = "original"; // Default dataset


    function fetchAndRenderGraph(mode) {
        const filePath = (mode == "clustering") ? (
            `https://ekmpa.github.io/Network-Science/public/data/${currentDataset}_${currentAlgo}.json`
        ) : (
            `https://ekmpa.github.io/Network-Science/public/data/spectral_${currDataLaplacian}.json`
        )
        // if mode, get other path 
        

        fetch(filePath)
            .then(response => response.json())
            .then(data => {
                processGraphData(data, mode); 
                // (mode == "clustering") ? (processGraphData(data)) : (getSpectralData(data));
                updateActiveButtons();
            })
            .catch(error => console.error("Error fetching graph data:", error));
    }
    function processGraphData(graphData, mode) {
        if (mode === "clustering") {
            // Process clustering graph data
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
    
        } else if (mode === "spectral") {
            // Process spectral layout data
            const nodes = graphData.map(node => ({
                id: node.id,
                x: parseFloat(node.x),
                y: parseFloat(node.y)
            }));
    
            // Check for NaN values
            nodes.forEach(d => {
                if (isNaN(d.x) || isNaN(d.y)) {
                    console.error(`Invalid spectral coordinates for node ${d.id}:`, d);
                }
            });
    
            renderSpectralGraph(nodes);
        }
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
            .force("center", d3.forceCenter(width / 1.9, height / 2));

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


  function renderSpectralGraph(nodes) {
    d3.select("#spectral-laplacian").html(""); 

    const width = 600, height = 250;

    // For rapidité
    nodes = nodes.filter(() => Math.random() > 0.55);
    
    const svg = d3.select("#spectral-laplacian")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // bounding box of input coordinates
    const xExtent = d3.extent(nodes, d => d.x);
    const yExtent = d3.extent(nodes, d => d.y);

    const xScale = d3.scaleLinear()
        .domain(xExtent)
        .range([10, width]);  

    const yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([10, height]); 

    const simulation = d3.forceSimulation(nodes)
        .force("x", d3.forceX(d => xScale(d.x)).strength(0.1))
        .force("y", d3.forceY(d => yScale(d.y)).strength(0.1))
        .force("charge", d3.forceManyBody().strength(-0.01))
        .alphaDecay(0.05)
        .on("tick", ticked);

    const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 2)
        .attr("fill", "#c400a4")
        .call(drag(simulation));

    function ticked() {
        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);

        svg.selectAll("line")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    }
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
                fetchAndRenderGraph("clustering");
            }
        });
    });

    datasetButtons.forEach(button => {
        button.addEventListener("click", function () {
            const dataset = this.getAttribute("data-dataset");
            if (dataset !== currentDataset) {
                currentDataset = dataset;
                fetchAndRenderGraph("clustering");
            }
        });
    });
    fetchAndRenderGraph("clustering");
    fetchAndRenderGraph("spectral");
});