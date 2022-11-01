function testing(){
  console.log("Alou");
}

function main() {

"use strict";

  //1º passo:
  //Cria contexto WEBGL e Programa (Vertex Shader + Fragment Shadder)
  const {gl, programInfo} = makeGLContextAndProgram();
  
  cameraGUI();
  //blueGUI();
  //greenGUI();
  redGUI();

  
  var numberOfObjects = 0;

  var myObjectVAO;
  var myObjectBufferInfo;



  var objectsToDraw = [];
  var objects = [];
  var nodeInfosByName = {};



  // cria a cena em formato de arvore
  var sceneDescription =
    {
      name: "origin",
      draw: false,
      children: [],
    };

  
  function makeNode(nodeDescription) {
    var trs  = new TRS();
    var node = new Node(trs);

    nodeInfosByName[nodeDescription.name] = {
      trs: trs,
      node: node,
    };
    trs.translation = nodeDescription.translation || trs.translation;
    if (nodeDescription.draw !== false) {
          node.drawInfo = {
          uniforms: {
            u_colorMult: [1, 1, 1, 1],
            u_matrix: m4.identity(),
          },
          programInfo: programInfo,
          bufferInfo: myObjectBufferInfo,
          vertexArray: myObjectVAO,
        };
        objectsToDraw.push(node.drawInfo);
        objects.push(node);    
    }
    makeNodes(nodeDescription.children).forEach(function(child) {
      child.setParent(node);
    });
    return node;
  }

  function makeNodes(nodeDescriptions) {
    return nodeDescriptions ? nodeDescriptions.map(makeNode) : [];
  }

  var scene = makeNode(sceneDescription);
  

  //funcao que carrega um novo objeto atraves do arquivo
  function loadNewObject(){
    var objectData;
    //Cria um request para leitura de arquivo
    const request = new XMLHttpRequest();
    //URL do arquivo solicitado
    const url = "./objects/d6dice.json";
    //realiza o GET do arquivo (false = força que seja sincrono - estava tendo problemas com leitura assincrona)
    request.open("GET",url,false);
    request.send(null);
    //se encontrou o arquivo, copia os dados que estao em formato texto e realiza o parse para JSON Object
    if (request.status === 200) {
      //copia dos dados em formato texto
      let data=request.response;
      //realiza o PARSE para formato JSON
      //objectData cointem os dados (buffers e ID) do objeto a ser carregado
      objectData = JSON.parse(data);
      numberOfObjects++;
      objectData.objID= `10${numberOfObjects}`;
    }
    else
    {
      console.log("ERRO NA LEITURA DE ARQUIVO");
      return;
    }

    //Printa o conteudo do objeto
    
    console.log("ObjectID: "+objectData.objID);
    console.log("Position: "+objectData.arrays.position.data);
    console.log("UV Coord: "+objectData.arrays.texcoord.data);
    console.log("Indices: "+objectData.arrays.indices.data);
    console.log("Colors: "+objectData.arrays.color.data);


    //cria os buffers através do array no objeto recebido
    myObjectBufferInfo = twgl.createBufferInfoFromArrays(gl,objectData.arrays)
    //cria o VAO baseado nos buffers
    myObjectVAO = twgl.createVAOFromBufferInfo(gl, programInfo, myObjectBufferInfo);

    //insere o objeto na cena
    addObjectToScene(objectData);
  }

  //insere o objeto na cena e recria a cena
  function addObjectToScene(obj){

    sceneDescription.children.push({
      name: obj.objID,
      translation: [0,0,0],
    });

    scene = makeNode(sceneDescription);
  }


  loadNewObject();
  

  //addObjectToScene();
  
  //criar lista de objetos e lista de objetos para desenhar (alguns podem não ser desenhados)
  //cada objeto será um nodo da scena, a origem será um nodo também


   //Configura FOV
   var fieldOfViewRadians = degToRad(60);

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time *= 0.001;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    //gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 1, 200);

    // Compute the camera's matrix using look at.
    var cameraPosition = [cameraControl.cameraPosX, cameraControl.cameraPosY, cameraControl.cameraPosZ];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    
    //controla a animação e velocidade de rotação dos objetos
    nodeInfosByName["101"].trs.rotation[1]= (time*redControl.speed)*redControl.animate;
    //nodeInfosByName["red"].trs.rotation[1]= redControl.rotate;
    //nodeInfosByName["green"].trs.rotation[1]= (time*greenControl.speed)*greenControl.animate;
    //nodeInfosByName["blue"].trs.rotation[1]= (time*blueControl.speed)*blueControl.animate;


    nodeInfosByName["101"].trs.translation= [redControl.positionX,redControl.positionY,redControl.positionZ];
    //nodeInfosByName["green"].trs.translation= [greenControl.positionX,greenControl.positionY,greenControl.positionZ];
    //nodeInfosByName["blue"].trs.translation= [blueControl.positionX,blueControl.positionY,blueControl.positionZ];

    nodeInfosByName["101"].trs.scale= [redControl.scale,redControl.scale,redControl.scale];
    //nodeInfosByName["green"].trs.scale= [greenControl.scale,greenControl.scale,greenControl.scale];
    //nodeInfosByName["blue"].trs.scale= [blueControl.scale,blueControl.scale,blueControl.scale];


    // Update all world matrices in the scene graph
    scene.updateWorldMatrix();

    // Compute all the matrices for rendering
    objects.forEach(function(object) {
        object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

    
   
    
    // ------ Draw the objects --------
    twgl.drawObjectList(gl, objectsToDraw);

    requestAnimationFrame(drawScene);
  }
}

main();