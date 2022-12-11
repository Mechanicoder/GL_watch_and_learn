// HelloQuad.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '}\n';
 
// Fragment shader program
var FSHADER_SOURCE =
    'void main() {\n' +
    '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';
// Size of off screen
var OFFSCREEN_WIDTH = 256;
var OFFSCREEN_HEIGHT = 256;
 
 
//顶点坐标，纹理坐标，模型视图矩阵，将顶点着色器中的纹理坐标传递给片元v_TexCoord纹理坐标
var m_VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '}\n';
 
// 采样器，纹理坐标，纹理着色片元
var m_FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'void main() {\n' +
    '  gl_FragColor = texture2D(u_Sampler, vec2(0.5,0.5));\n' +
    '}\n'
 
 
function main() {
    //通过getElementById()方法获取canvas画布
    var canvas = document.getElementById('webgl');
    //通过方法getContext()获取WebGL上下文
    var gl = canvas.getContext('webgl');

    // var ext = gl.getExtension('WEBGL_draw_buffers')
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
 
   let initProgram =  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)
 
    var fbo = initFramebufferObject(gl);
 
    // Write the positions of vertices to a vertex shader
    var n = initVertexBuffers(gl);
 
       //绑定帧缓冲区
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);              // Change the drawing         destination to FBO
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // Set a viewport for FBO
    //设置背景色
    gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
    //清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear FBO
 
    //一直前清空
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }
 
    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
 
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
 
 
    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);        // Change the drawing destination to color buffer
    //重新设置屏幕渲染的视点
    gl.viewport(0, 0, canvas.width, canvas.height);  // Set the size of viewport back to that of <canvas>
 
 
    let newProgram =  initShaders(gl, m_VSHADER_SOURCE, m_FSHADER_SOURCE);
    // Bind the texture object to the target
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
     initVertexBuffers(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
 
 
}
function initFramebufferObject(gl) {
    var framebuffer, texture, depthBuffer;
 
 
    // 创建FBO 帧缓冲区
    framebuffer = gl.createFramebuffer();
 
    // Create a texture object and set its size and parameters
    texture = gl.createTexture(); // Create a texture object
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    framebuffer.texture = texture; // Store the texture object
 
 
    // 将帧缓冲区绑定到程序上
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
 
 
 
    // The WebGLRenderingContext.framebufferTexture2D() method of the WebGL API attaches a texture to a WebGLFramebuffer.
    //将framebufer渲染到一个纹理附件中
 
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
 
 
    // 创建渲染缓冲区
    depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    //将帧缓冲区绑定到渲染缓冲区上
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
 
 
    // 解除帧缓冲区绑定
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    //解除纹理
    gl.bindTexture(gl.TEXTURE_2D, null);
    //解除 渲染缓冲区
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
 
 
    return framebuffer;
}
 
function initVertexBuffers(gl) {
    var vertices = new Float32Array([
        -0.5, 0.5,   -0.5, -0.5,      0.5, 0.5,　0.5, -0.5
    ]);
    var n = 4; // The number of vertices
 
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
 
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
 
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
 
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
 
    return n;
}

//main();