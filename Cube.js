class Cube{
    constructor(){
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        // this.normalMatrix = new Matrix4();
        this.textureNum = -2;
    }

    render(){
        var rgba = this.color;

        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //Back
        drawTriangle3DUVNormal([0.0,1.0,1.0, 1.0,1.0,1.0, 1.0,0.0,1.0], [1.0,1.0, 0.0,1.0, 0.0,0.0], [0,0,1, 0,0,1, 0,0,1]);
        drawTriangle3DUVNormal([0.0,1.0,1.0, 1.0,0.0,1.0, 0.0,0.0,1.0], [1.0,1.0, 0.0,0.0, 1.0,0.0], [0,0,1, 0,0,1, 0,0,1]);

        // gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        //Top
        drawTriangle3DUVNormal([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0], [0,-1,0, 0,-1,0, 0,-1,0]);
        drawTriangle3DUVNormal([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1], [0,-1,0, 0,-1,0, 0,-1,0]);

        // gl.uniform4f(u_FragColor, rgba[0]*.6, rgba[1]*.6, rgba[2]*.6, rgba[3]);

        //Left
        drawTriangle3DUVNormal([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 1,0], [1,0,0, 1,0,0, 1,0,0]);
        drawTriangle3DUVNormal([1,0,0, 1,1,0, 1,1,1], [0,0, 0,1, 1,1], [1,0,0, 1,0,0, 1,0,0]);

        // gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //Front
        drawTriangle3DUVNormal([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0], [0,0,-1, 0,0,-1, 0,0,-1]);
        drawTriangle3DUVNormal([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1], [0,0,-1, 0,0,-1, 0,0,-1]);

        // gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        //Bottom
        drawTriangle3DUVNormal([0,0,0, 1,0,1, 1,0,0], [1,0, 0,1, 0,0], [0,1,0, 0,1,0, 0,1,0]);
        drawTriangle3DUVNormal([0,0,0, 0,0,1, 1,0,1], [1,0, 1,1, 0,1], [0,1,0, 0,1,0, 0,1,0]);

        // gl.uniform4f(u_FragColor, rgba[0]*.6, rgba[1]*.6, rgba[2]*.6, rgba[3]);

        //Right
        drawTriangle3DUVNormal([0,0,0, 0,1,1, 0,0,1], [1,0, 0,1, 0,0], [-1,0,0, -1,0,0, -1,0,0]);
        drawTriangle3DUVNormal([0,0,0, 0,1,0, 0,1,1], [1,0, 1,1, 0,1], [-1,0,0, -1,0,0, -1,0,0]);
    }

    renderfast(){
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        var allverts = [];

        // Front of cube
        allverts = allverts.concat([0,0,0, 1,1,0, 1,0,0]);
        allverts = allverts.concat([0,0,0, 0,1,0, 1,1,0]);

        // Top of cube
        allverts = allverts.concat([0,1,0, 0,1,1, 1,1,1]);
        allverts = allverts.concat([0,1,0, 1,1,1, 1,1,0]);

        // Bottom of cube
        allverts = allverts.concat([0,1,0, 0,1,1, 1,1,1]);
        allverts = allverts.concat([0,1,0, 1,1,1, 1,1,0]);

        // Right of cube
        allverts = allverts.concat([0,0,0, 1,0,1, 0,0,1]);
        allverts = allverts.concat([0,0,0, 1,0,0, 1,0,1]);

        // Left of cube
        allverts = allverts.concat([1,0,0, 1,1,1, 1,1,0]);
        allverts = allverts.concat([1,0,0, 1,0,1, 1,1,1]);

        // Back of cube
        allverts = allverts.concat([0,0,1, 1,1,1, 0,1,1]);
        allverts = allverts.concat([0,0,1, 1,0,1, 1,1,1]);

        drawTriangle3D(allverts);
    }

}
