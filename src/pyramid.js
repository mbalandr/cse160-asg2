/*
Mariah Balandran
mbalandr@ucsc.edu

Notes to Grader:
Used ChatGPT to learn how to make a pyramid.
*/

class Pyramid {
    constructor(baseWidth = 1, height = 1) {
        this.type = 'pyramid';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        
        // Generate vertices and indices
        const verticesAndIndices = this.generatePyramidData(baseWidth, height);
        this.vertices = new Float32Array(verticesAndIndices.vertices);
        this.indices = new Uint8Array(verticesAndIndices.indices);

        // Create buffers
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();

        if (!this.vertexBuffer || !this.indexBuffer) {
            console.log('Failed to create buffers');
            return;
        }

        // Initialize buffers
        this.initBuffers();
    }

    generatePyramidData(baseWidth, height) {
        const halfWidth = baseWidth / 2;
        
        const vertices = [
            // Base vertices
            -halfWidth, 0, -halfWidth,  // 0
            halfWidth, 0, -halfWidth,   // 1
            halfWidth, 0, halfWidth,    // 2
            -halfWidth, 0, halfWidth,   // 3
            // Apex
            0, height, 0                // 4
        ];

        const indices = [
            // Base (bottom face)
            0, 1, 2,    // First triangle
            0, 2, 3,    // Second triangle
            // Front face
            0, 1, 4,    // Front triangle
            // Right face
            1, 2, 4,    // Right triangle
            // Back face
            2, 3, 4,    // Back triangle
            // Left face
            3, 0, 4     // Left triangle
        ];

        return {
            vertices: vertices,
            indices: indices
        };
    }

    initBuffers() {
        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    render() {
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // Draw each face with different shading
        const faces = [
            // Base (bottom)
            {
                startIndex: 0,
                count: 6,
                shade: 0.5
            },
            // Front face
            {
                startIndex: 6,
                count: 3,
                shade: 1.0
            },
            // Right face
            {
                startIndex: 9,
                count: 3,
                shade: 0.9
            },
            // Back face
            {
                startIndex: 12,
                count: 3,
                shade: 0.8
            },
            // Left face
            {
                startIndex: 15,
                count: 3,
                shade: 0.7
            }
        ];

        faces.forEach(face => {
            // Apply shading to current face
            gl.uniform4f(
                u_FragColor,
                this.color[0] * face.shade,
                this.color[1] * face.shade,
                this.color[2] * face.shade,
                this.color[3]
            );

            // Draw the face
            gl.drawElements(
                gl.TRIANGLES,
                face.count,
                gl.UNSIGNED_BYTE,
                face.startIndex
            );
        });
    }
}