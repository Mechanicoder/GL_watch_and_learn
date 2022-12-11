let vertex_shader = `
    attribute vec3 mypos;
    attribute vec2 a_position;

    varying vec4 mycolor; // 将颜色传递给片段着色器

    uniform mat4 myviewmatrix;

    void main()
    {
        //给内置变量gl_PointSize赋值像素大小
        gl_PointSize=10.0;

        //顶点位置，位于坐标原点
        //gl_Position =vec4(mypos.xyz, 1.0);
        //gl_Position = a_position;
        //gl_Position = vec4(a_position.xy, 1, 1);
        //gl_Position = vec4(mypos.xyz, 1);
        gl_Position = myviewmatrix * vec4(mypos.xyz, 1);

        mycolor = gl_Position * 0.5 + 0.5;
    }
`;
let frag_shader = `
    #extension GL_EXT_frag_depth: enable
    precision lowp float;
    varying vec4 mycolor;
    void main()
    {
        //定义片元颜色
        gl_FragColor = mycolor;
        //gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }
`;


var lx = document.getElementById("LookAtX").value;
var ly = document.getElementById("LookAtY").value;
var lz = document.getElementById("LookAtZ").value;
var cx = document.getElementById("EyeCenterX").value;
var cy = document.getElementById("EyeCenterY").value;
var cz = document.getElementById("EyeCenterZ").value;
var ux = document.getElementById("EyeUpX").value;
var uy = document.getElementById("EyeUpY").value;
var uz = document.getElementById("EyeUpZ").value;

//通过getElementById()方法获取canvas画布
var canvas = document.getElementById('webgl');
//通过方法getContext()获取WebGL上下文
var gl = canvas.getContext('webgl');

//顶点着色器源码
var vertexShaderSource = vertex_shader;

//片元着色器源码
var fragShaderSource = frag_shader;

//初始化着色器
var program = initShader(gl, vertexShaderSource, fragShaderSource);
//开始绘制，显示器显示结果
//gl.drawArrays(gl.POINTS, 0, 1);

// 绘制三角形
const tri_data = new Float32Array([0.0, 0.0, -0.8, -0.8, 0.8, -0.8]);
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
gl.bufferData(gl.ARRAY_BUFFER, tri_data, gl.STATIC_DRAW);

const aposlocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(aposlocation);
gl.vertexAttribPointer(aposlocation, 2, gl.FLOAT, false, 0, 0);
//gl.drawArrays(gl.POINTS, 0, 3);

// 绘制正八面体
const len = 1.0;
var oct_data = new Float32Array(
    [len, 0, 0,
        0, len, 0,
        0, 0, len,
        -len, 0, 0,
        0, -len, 0,
        0, 0, -len]
);
var oct_indices = new Uint16Array(
    [2, 0, 1,
        2, 1, 3,
        2, 3, 4,
        2, 4, 0,
        5, 1, 0,
        5, 3, 1,
        5, 4, 3,
        5, 0, 4]
);

var vbuffer = gl.createBuffer();
//绑定缓冲区对象,激活buffer
gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
gl.bufferData(gl.ARRAY_BUFFER, oct_data, gl.STATIC_DRAW);

var ibuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, oct_indices, gl.STATIC_DRAW);

//允许数据传递
const myposlocation = gl.getAttribLocation(program, 'mypos');
gl.enableVertexAttribArray(myposlocation);
gl.vertexAttribPointer(myposlocation, 3, gl.FLOAT, false, 0, 0);

const timeout = 20;

// 相机视角
var myviewmat = new Matrix4(); // 单位矩阵
myviewmat.setLookAt(lx, ly, lz, cx, cy, cz, ux, uy, uz);
// 每次旋转1°
var rotmatrix = new Matrix4();
rotmatrix.rotate(1, 0, 0, 1);

//https://blog.csdn.net/A873054267/article/details/115757283

console.log("Start")

function Animation() {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;

    ApplyRandomViewMatrix();

    DrawTetrahedron();
    
    // https://stackoverflow.com/questions/26951675/webgl-framebuffer-render-depth-texture
    if (1) {
        
        //var [render_buffer, fb] = RenderToTexture(w, h);

        //ApplyRandomViewMatrix();

        //DrawTetrahedron();

        // 按整型 https://stackoverflow.com/questions/48139391/what-is-the-correct-way-to-use-gl-readpixels
        var pixels = new Uint8Array(w * h* 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        //LogError();

        var cnt = 0;
        for (var i = 0; i < w * h * 4; i += 4)
        {
            for (var j = 0; j < 4; ++j)
            {
                if (pixels[i + j] != 0)
                {
                    ++cnt;
                    break;
                }
            }
        }
        const ratio =  cnt / (w * h);
        ShowMsg("有效像素个数 " + cnt + "/" + w * h + "=" + Math.round(ratio * 100) + "%");

        // 接触绑定，仍绘制在画布上
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    setTimeout("Animation()", timeout); // 自动循环
}

//RenderToTexture();

setTimeout("Animation()", timeout);

function ApplyRandomViewMatrix()
{
    const now = Date.parse(new Date());
    const randommat = new Matrix4(); // 单位矩阵
    const ai = now % 3;
    const aj = now % 7;
    const ak = now % 23;
    if (ai + aj + ak != 0) {
        randommat.rotate(2, ai, aj, -ak);
        myviewmat.multiply(randommat);
    }

    myviewmat.multiply(rotmatrix);

    const myviewmatrixloc = gl.getUniformLocation(program, 'myviewmatrix');
    gl.uniformMatrix4fv(myviewmatrixloc, false, myviewmat.elements)
}

function DrawTetrahedron()
{
    // 下半部分
    //gl.drawArrays(gl.TRIANGLES, 0, 8);
    //gl.drawElements(gl.TRIANGLE_STRIP, 24, gl.UNSIGNED_SHORT, 0); // 以共享两个点绘制三角形
    //gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);  // 以无共享点绘制三角形，填充
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 12 * 2);  // 以无共享点绘制三角形，填充
    //gl.drawElements(gl.POINTS, 15, gl.UNSIGNED_SHORT, 0);
    //gl.drawElements(gl.LINE_STRIP, 24, gl.UNSIGNED_SHORT, 0);  // 以共享一个点绘制三角形
    //gl.drawElements(gl.LINE_LOOP, 24, gl.UNSIGNED_SHORT, 0);

    // 上半部分
    gl.drawElements(gl.LINES, 23, gl.UNSIGNED_SHORT, 0); // 正四面体上半部分
    //gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);  // 以无共享点绘制三角形，填充

    //gl.drawElements(gl.TRIANGLE_FAN, 24, gl.UNSIGNED_SHORT, 0); // 扇形，以共享一个点绘制三角形
}

function RenderToTexture(width, height)
{
    // 纹理
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    
    // 定义 0 级的大小和格式
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data); // 按指定大小初始化为空

    //{
    //    const ext = gl.getExtension('WEBGL_depth_texture');
    //    gl.texImage2D(gl.TEXTURE_2D, level, gl.DEPTH_COMPONENT, width, height, border, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, data);
    //}

    // 设置筛选器，不需要使用贴图
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 附加纹理为第一个颜色附件
    const attachmentPoint = gl.COLOR_ATTACHMENT0; // 颜色关联
    //const attachmentPoint = gl.DEPTH_ATTACHMENT; // 深度关联

    // 创建并绑定帧缓冲
    const fb = gl.createFramebuffer();
    // 通过绑定帧缓冲绘制到纹理
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, level);

    var render_buffer = gl.createRenderbuffer();
    gl.bindRenderbuffer( gl.RENDERBUFFER, render_buffer );
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, render_buffer);

    //LogError();

    // 告诉WebGL如何从裁剪空间映射到像素空间
    gl.viewport(0, 0, width, height);

    // 清空画布和深度缓冲
    //gl.clearColor(1, 0, 1, 1);   // clear to blue
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    return [render_buffer, fb];
}


//声明初始化着色器函数
function initShader(gl, vertexShaderSource, fragmentShaderSource) {
    //创建顶点着色器对象
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    //创建片元着色器对象
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    //引入顶点、片元着色器源代码
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    //编译顶点、片元着色器
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    //创建程序对象program
    var program = gl.createProgram();
    //附着顶点着色器和片元着色器到program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    //链接program
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (success) {
        gl.enable(gl.DEPTH_TEST); // 深度测试
        gl.useProgram(program);
        return program
    }
    else {
        console.error(gl.getProgramInfoLog(program), 'test---')
        gl.deleteProgram(program)
    }
}

// function ViewChange()
// {
//     var lx = document.getElementById("LookAtX");
//     var ly = document.getElementById("LookAtY");
//     var lz = document.getElementById("LookAtZ");
//     var cx = document.getElementById("EyeCenterX");
//     var cy = document.getElementById("EyeCenterY");
//     var cz = document.getElementById("EyeCenterZ");
//     var ux = document.getElementById("EyeUpX");
//     var uy = document.getElementById("EyeUpY");
//     var uz = document.getElementById("EyeUpZ");
// }

function LogError()
{
    while (true) {
        const err = gl.getError();
        switch (err) {
            case gl.NO_ERROR: console.log('NO_ERROR'); return;
            case gl.INVALID_ENUM: console.log('INVALID_ENUM'); break;
            case gl.INVALID_VALUE: console.log('INVALID_VALUE'); break;
            case gl.INVALID_OPERATION: console.log('INVALID_OPERATION'); break;
            case gl.INVALID_FRAMEBUFFER_OPERATION: console.log('INVALID_FRAMEBUFFER_OPERATION'); break
            case gl.OUT_OF_MEMORY: console.log('OUT_OF_MEMORY'); break
            case gl.CONTEXT_LOST_WEBGL: console.log('CONTEXT_LOST_WEBGL'); break;
        }
    }
}

function ShowMsg(msg)
{
    document.getElementById("Message").value = msg;
}