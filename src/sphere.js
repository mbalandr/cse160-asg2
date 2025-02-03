/*
Mariah Balandran
mbalandr@ucsc.edu

Notes to Grader:
Used ChatGPT to learn how to make a sphere.
*/

class Sphere {
    constructor(radius = 1, latitudeBands = 30, longitudeBands = 30) {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        
        // Generate vertices and indices
        const verticesAndIndices = this.generateSphereData(radius, latitudeBands, longitudeBands);
        this.vertices = new Float32Array(verticesAndIndices.vertices);
        this.indices = new Uint16Array(verticesAndIndices.indices);
        this.normals = new Float32Array(verticesAndIndices.normals);

        // Create buffers
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        if (!this.vertexBuffer || !this.indexBuffer || !this.normalBuffer) {
            console.log('Failed to create buffers');
            return;
        }

        // Initialize buffers
        this.initBuffers();
    }

    generateSphereData(radius, latitudeBands, longitudeBands) {
        const vertices = [];
        const indices = [];
        const normals = [];

        // Generate vertices
        for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            const theta = latNumber * Math.PI / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                const phi = longNumber * 2 * Math.PI / longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                // Calculate vertex position
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                // Add vertex coordinates (scaled by radius)
                vertices.push(radius * x);
                vertices.push(radius * y);
                vertices.push(radius * z);

                // Add normal vector (normalized vertex position)
                normals.push(x);
                normals.push(y);
                normals.push(z);
            }
        }

        // Generate indices
        for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
                const first = (latNumber * (longitudeBands + 1)) + longNumber;
                const second = first + longitudeBands + 1;

                // First triangle of quad
                indices.push(first);
                indices.push(second);
                indices.push(first + 1);

                // Second triangle of quad
                indices.push(second);
                indices.push(second + 1);
                indices.push(first + 1);
            }
        }

        return {
            vertices: vertices,
            indices: indices,
            normals: normals
        };
    }

    initBuffers() {
        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    render() {
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // Draw the sphere
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}