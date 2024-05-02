const ctn = document.getElementById("container");
const bindedFields = [];
const customContextField = [];
const customContextStage = [];
var width = window.innerWidth * 0.70 - 30;
var height = window.innerHeight / 1.2;


var stage = new Konva.Stage({
	container: 'container',
	width: ctn.offsetWidth,
	height: ctn.offsetHeight,
	draggable: false,
});

let maSaveAuto = setInterval(function(){
	localStorage.setItem("mindmap",JSON.stringify(getClassRoot()));
},1000);

window.addEventListener("resize", (event) => {
	stage.width(ctn.offsetWidth);
	stage.height(ctn.offsetHeight);
});

window.addEventListener("keydown", (event) => {
	if(event.keyCode == 46 && currentRect){
		deleteSkill();
	}
});

//Hide context menu
window.addEventListener("click" , (event) => {
	if(displayedContextMenu){
		hideContextMenu();
	}
});

var currentRect;
var currentSkill;
var circles = [];
var skillsToRect = {};

var layer = new Konva.Layer();
stage.add(layer);

const modeDisplay = document.getElementById("currentMode");
modeDisplay.addEventListener("click",() => {mode.value = "normal"});

drawLinks();

var originRect;
var displayedContextMenu = false;
var mode = new Proxy({value : "normal"},{
	set(t,k,v){
		if(v == "normal"){
			modeDisplay.innerHTML ="";
			modeDisplay.style.display = "none";
		}
		else{
			modeDisplay.style.display = "inline";
		}
		if(v == "ctxSelectChild"){
			modeDisplay.innerHTML = "Annuler (Selection d'enfant)";
		}
		if(v == "ctxSelectParent"){
			modeDisplay.innerHTML = "Annuler (Selection de parent)";
		}
	}
});
var ctxNode;

function reset(){
	if(confirm("ATTENTION : Vous allez perdre toute votre map, confirmer ?")){
		clearInterval(maSaveAuto);
		localStorage.setItem("mindmap",null);
		location.reload();
	}
}

function hideContextMenu(){
	if(displayedContextMenu){
		document.body.removeChild(document.getElementById("contextMenu"));
		displayedContextMenu = false;
	}
}

stage.on('wheel', (e) => {
	// stop default scrolling
	e.evt.preventDefault();

	var oldScale = stage.scaleX();
	var pointer = stage.getPointerPosition();

	var mousePointTo = {
	  x: (pointer.x - stage.x()) / oldScale,
	  y: (pointer.y - stage.y()) / oldScale,
	};

	// how to scale? Zoom in? Or zoom out?
	let direction = e.evt.deltaY > 0 ? 1 : -1;

	// when we zoom on trackpad, e.evt.ctrlKey is true
	// in that case lets revert direction
	if (e.evt.ctrlKey) {
	  direction = -direction;
	}

	var newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

	if(newScale >= minZoom && newScale <= maxZoom){
		stage.scale({ x: newScale, y: newScale });

		var newPos = {
		  x: pointer.x - mousePointTo.x * newScale,
		  y: pointer.y - mousePointTo.y * newScale,
		};
		stage.position(newPos);
	}
});

stage.on("contextmenu",(e) => {
	e.evt.preventDefault();
	if(e.target._id == 1){
	let customContext = "";
		customContextStage.forEach( (elem) => {
			customContext += "<li onclick='"+elem.funcName+"()>"+elem.name+"</li>";
		});
	makeContextMenu(e,`
	`);
	}
});

addEventListener("DOMContentLoaded",(ev) =>{
	if(localStorage.getItem("mindmap")){
		loadData(JSON.parse(localStorage.getItem("mindmap")));
	}
})


function majField(field){
	currentSkill[field.name] = field.value;
	if(field.name == "name"){
		let txt = currentRect.getAttr("linkedText");
		txt.setAttr("text",field.value);
		let wCalc = txt.width();
		let hCalc = txt.textArr.length * lineHeight;
		let middleCirc = {
			x: currentRect.x(),
			y: currentRect.y()
		};
		let middleText = {
			x: wCalc / 2,
			y: hCalc / 2
		};
		
		txt.x(middleCirc.x - middleText.x);
		txt.y(middleCirc.y - middleText.y);
	}
}

function majImg(img){
	majField(img);
	loadImg(currentRect);
}

function majRect(circleField){
	currentRect.setAttr(circleField.name,Number(circleField.value));
	let skill = currentRect.getAttr('linkedSkill');
	
	let wCalc = currentRect.getAttr("linkedText").width();
	let hCalc = currentRect.getAttr("linkedText").textArr.length * lineHeight;
	
	currentRect.getAttr("linkedText").x(currentRect.x() - wCalc / 2);
	currentRect.getAttr("linkedText").y(currentRect.y() - hCalc / 2);
	skill.childs.forEach(function (skl){
		let childRect = skillsToRect[skl.id];
		updateLinePosition(currentRect,childRect,skl.line);
	});
	skill.parents.forEach(function (skl){
		let parentRect = skillsToRect[skl.id];
		updateLinePosition(parentRect,currentRect,skl.line);
	});
}

function isColor(strColor){
  const s = new Option().style;
  s.color = strColor;
  return s.color !== '';
}

function majColor(colorField){
	let color = colorField.value;
	if(isColor(color)){
		currentRect.getAttr("linkedSkill").fillColor = color;
		currentRect.setAttr("fill",color);
	}
}

function addChild(child = null){
	let curRect = currentRect;
	let childId = child ? child.getAttr("linkedSkill").id : document.forms["skill"].newchild.value;
	if(childId && curRect.getAttr("linkedSkill").parents.findIndex(e => {return e.id == childId}) == -1 && curRect.getAttr("linkedSkill").childs.findIndex(e => {return e.id == childId}) == -1 ){
		linkToChild(curRect,skillsToRect[childId]);
		//updatePossibleChilds();
	}
	else{
		console.log("Ces noeuds ont déjà un lien de parenté");
	}
}

function linkToChild(parentRect,childRect){
	createLine(parentRect,childRect);
}

function adaptOldFormat(oldObject){
	rootSkl = oldObject.skills.find((skl) => skl.id == 0);
	baseSkills = [];
	oldObject.skills.forEach(function(skl){
		if(skl.parent == 0){
			baseSkills.push(skl);
		}
	});
	delete rootSkl.parent;
	rootSkl.parents = [];
	rootSkl.childs = [];
	delete rootSkl.icon;
	rootSkl.posX = window.innerWidth/4;
	rootSkl.posY = window.innerHeight/2;
	
	if(baseSkills.length == 2){
		adaptOldSkill(baseSkills[0], rootSkl, 0, 75, 1, 1,oldObject);
		adaptOldSkill(baseSkills[1], rootSkl, 0, -75, 1, 1,oldObject);
	}
	else if(baseSkills.length == 1) {
		rootSkl.posY = interval;
		adaptOldSkill(baseSkills[0], rootSkl, 0, 75, 1, 1,oldObject);
	}
}

function updatePossibleChilds(){
	document.forms["skill"].newchild.innerHTML = "<option value ='' selected>Selectionnez un enfant</option>";
	let skillToAdd = [];
	circles.forEach(function (circle){
		othSkill = circle.getAttr("linkedSkill");
		if(othSkill.id != currentSkill.id && 
		currentSkill.parents.findIndex((e) => e.id == othSkill.id) == -1 &&
		currentSkill.childs.findIndex((e) => e.id == othSkill.id) == -1){
			skillToAdd.push({id: othSkill.id,name: othSkill.name});
		}
	});
	skillToAdd.sort((e1,e2) => {return e1.name < e2.name ? -1 : 1;});
	skillToAdd.forEach(function (skl){
		document.forms["skill"].newchild.innerHTML += "<option value='" + skl.id + "'>"+skl.name+"</option>";
	});
}

function deleteAncestry(){
	currentSkill.parents.forEach(function(par){
		let parSkillIndex = skillsToRect[par.id].getAttr("linkedSkill").childs.findIndex((e) => e.id == currentSkill.id);
		skillsToRect[par.id].getAttr("linkedSkill").childs.splice(parSkillIndex,1);
		par.line.destroy();
	});
	currentSkill.parents = [];
	currentSkill.childs.forEach(function(cld){
		let cldSkillIndex = skillsToRect[cld.id].getAttr("linkedSkill").parents.findIndex((e) => e.id == currentSkill.id);
		skillsToRect[cld.id].getAttr("linkedSkill").parents.splice(cldSkillIndex,1);
		cld.line.destroy();
	});
	currentSkill.childs = [];
}

function deleteSkill(){
	deleteAncestry();
	delete skillToRect[currentSkill.id];
	circles.splice(circles.findIndex((e) => (e.getAttr("linkedSkill").id == currentSkill.id)),1);
	currentRect.getAttr("linkedText").destroy();
	currentRect.destroy();
	currentRect = null;
	currentSkill = null;
	document.forms["skill"].style.display = "none";
}

function loadImg(circle){
	let imagesrc = new window.Image();
	imagesrc.onload = function(){
		circle.fillPatternImage(imagesrc);
		let scaleX = defWidth / imagesrc.width;
		let scaleY = defHeight / imagesrc.height;
		circle.fillPatternScale({
		  x: scaleX,
		  y: scaleY
		});
	}
	imageExists(circle.getAttr("linkedSkill").icon).then(function(result){
		if(result){
		circle.fill("");
		imagesrc.src = circle.getAttr("linkedSkill").icon;
		}
		else{
			circle.fill('#007bff');
		}
	});
}

async function imageExists(image_url){

    var http = new XMLHttpRequest();

    http.open('HEAD', image_url, false);
    http.send();

    return http.status != 404;

}

function hideTooltip(){
	let tooltip = document.getElementById("tooltip");
	tooltip.classList.remove("tooltipD");
	tooltip.classList.add("tooltipND");	
}

function unhighlightSkillLines(skill, first = true){
	if(first){
		skill.childs.forEach(function (child){
			child.line.setAttr("stroke","black");
		});
	}
	skill.parents.forEach(function (par){
		if(par.line.getAttr("stroke") != "black"){
			par.line.setAttr("stroke","black");
			unhighlightSkillLines(skillsToRect[par.id].getAttr("linkedSkill"),false);
		}
	});
}

function highlightSkillLines(skill,first = true){
	if(first){
		skill.childs.forEach(function (child){
			child.line.setAttr("stroke","green");
		});
	}
	skill.parents.forEach(function (par){
		if(par.line.getAttr("stroke") == "black"){
			par.line.setAttr("stroke","red");
			highlightSkillLines(skillsToRect[par.id].getAttr("linkedSkill"),false);
		}
	});
}

function makeContextMenu(e, content){
	hideContextMenu();
	displayedContextMenu = true;
	let menuDiv = document.createElement("DIV");
	menuDiv.innerHTML = content;
	menuDiv.id = "contextMenu";
	menuDiv.style.position = "absolute";
	menuDiv.style.top = e.evt.clientY + "px";
	menuDiv.style.left = e.evt.clientX + "px";
	menuDiv.classList.add("ctxMenu");
	document.body.appendChild(menuDiv);
}

function ctxAddChild(){
	mode.value = "ctxSelectChild";
	ctxNode = currentRect;
	
}

function ctxAddParent(){
	mode.value = "ctxSelectParent";
	ctxNode = currentRect;
}

function ctxAddNode(){
	makeSkill();
}

function selectNode(e){
    if(currentRect){
        currentRect.stroke("black"); // Colorer lien en noir
        unhighlightSkillLines(currentRect.getAttr('linkedSkill')); // Creer le lien
    }
    currentRect = e.target; // Ciblé un element
    currentRect.stroke("red"); // met le contour de la mindmap en rouge
    currentSkill = e.target.getAttr('linkedSkill');  
    highlightSkillLines(currentSkill); //mettre en surbrillance
    document.forms["skill"].name.value = currentSkill.name;    //
    document.forms["skill"].style.display = "flex"; // rend le formulaire flexible
    
    if (bindedFields && Array.isArray(bindedFields)) {
        bindedFields.forEach((elem) => {
            if (elem && elem.name && document.forms["skill"].elements[elem.name]) {
                document.forms["skill"].elements[elem.name].value = currentSkill.hasOwnProperty(elem.name) ? currentSkill[elem.name] : "";
            }
        });
    }
    
    hideTooltip(); // reference a la fonction
	let selEvent = new Event("treenodeSelected");
	document.dispatchEvent(selEvent);
    //updatePossibleChilds();
}


function getSelectedSkill(){
	if(currentRect){
		return currentRect.getAttr('linkedSkill');
	}
}

function makeSkill(posX = -stage.x() / stage.scaleX() + stage.width() / (2 * stage.scaleX()), posY = -stage.y() / stage.scaleY() + stage.height() / (2 * stage.scaleY()), skill = null) {
	let circle = new Konva.Ellipse({
		x: posX,
		y: posY,
		width: defWidth,
		height: defHeight,
		//fill: '#007bff',
		stroke: 'black',
		strokeWidth: 2,
		draggable : false,
		linkedSkill : {
			icon: "",
			id: idSeq,
			name: "Nouveau",
			parents: [],
			childs : [],
			fillColor : ""
		},
		linkedText : new Konva.Text({
			x: posX,
			y: posY,
			width: defWidth / 1.5,
			height: defHeight / 2,
			text : "Nouveau",
			align: "center",
			draggable : false
		})
	});
	
	if(skill){
		circle.setAttr("linkedSkill",skill);
		
		circle.getAttr("linkedText").setAttr("text",skill.name);
		skillsToRect[skill.id] = circle;
		if(idSeq <= skill.id){
			idSeq = skill.id + 1;
		}
		if(skill.icon){
			loadImg(circle);
		}else{
			let color = skill.fillColor ? skill.fillColor : '#007bff';
			circle.fill(color);
		}
	}
	else{
		circle.getAttr("linkedSkill").fillColor = "#007bff";
		circle.fill("#007bff");
		skillsToRect[idSeq] = circle;
		idSeq++;
	}
	
	let htCalc = circle.getAttr("linkedText").textArr.length * lineHeight;

	circle.getAttr("linkedText").x(circle.x() - circle.getAttr("linkedText").width() / 2);
	circle.getAttr("linkedText").y(circle.y() - htCalc / 2);

	
	circles.push(circle);
	//Add listener for click
	circle.on("click",function(e){
		if(mode.value == "ctxSelectChild"){
			let tempNode = e.target;
			currentRect = ctxNode;
			addChild(tempNode);
			mode.value = "normal";
		}
		if(mode.value == "ctxSelectParent"){
			currentRect = e.target;
			addChild(ctxNode);
			mode.value = "normal";
		}
		selectNode(e);
	});
	//Add contextmenu behaviour
	circle.on('contextmenu',(e) => {
		let customContext = "";
		customContextField.forEach( (elem) => {
			customContext += "<li onclick='"+elem.funcName+"()>"+elem.name+"</li>";
		});
		makeContextMenu(e, `
	`)});
	
	//Add behaviour for dragmove
	circle.on('dragmove',function dragMove(e){
		let curRect = e.target;
		let skill = e.target.getAttr('linkedSkill');
		skill.childs.forEach(function (skl){
			let childRect = skillsToRect[skl.id];
			updateLinePosition(curRect,childRect,skl.line);
		});
		skill.parents.forEach(function (skl){
			let parentRect = skillsToRect[skl.id];
			updateLinePosition(parentRect,curRect,skl.line);
		});
		
		let wCalc = e.target.getAttr("linkedText").width();
		let hCalc = e.target.getAttr("linkedText").textArr.length * lineHeight;
		
		e.target.getAttr("linkedText").x(e.target.x() - wCalc / 2);
		e.target.getAttr("linkedText").y(e.target.y() - hCalc / 2);
		if(currentRect && curRect.getAttr("id") == currentRect.getAttr("id")){
			document.forms["skill"].x.value = curRect.getAttr("x");
			document.forms["skill"].y.value = curRect.getAttr("y");
		}
	});
	circle.getAttr("linkedText").on("click",function(e){circle.fire("click")});
	circle.getAttr("linkedText").on("dragmove",function(e){
		let curRect = circle;
		let skill = circle.getAttr("linkedSkill");
		skill.childs.forEach(function (skl){
			let childRect = skillsToRect[skl.id];
			updateLinePosition(curRect,childRect,skl.line);
		});
		skill.parents.forEach(function (skl){
			let parentRect = skillsToRect[skl.id];
			updateLinePosition(parentRect,curRect,skl.line);
		});
		
		let wCalc = e.target.width();
		let hCalc = e.target.textArr.length * lineHeight;
		
		circle.x(e.target.x() + wCalc / 2);
		circle.y(e.target.y() + hCalc / 2);
		if(currentRect && curRect.getAttr("id") == currentRect.getAttr("id")){
			document.forms["skill"].x.value = curRect.getAttr("x");
			document.forms["skill"].y.value = curRect.getAttr("y");
		}
	});
	/*circle.on("dblclick",function(e){
		let curSkill = e.target.getAttr('linkedSkill');
		let monLien = curSkill.description;
		window.open(monLien, '_blank');
	});*/
	//circle.getAttr("linkedText").on("dblclick",(e) => {circle.fire("dblclick");});
	circle.getAttr("linkedText").on("contextmenu",(e) => {
		let customContext = "";
		customContextField.forEach( (elem) => {
			customContext += "<li onclick='"+elem.funcName+"()>"+elem.name+"</li>";
		});
		makeContextMenu(e, `
	`)});
	// add the shape to the layer
	layer.add(circle);
	layer.add(circle.getAttr("linkedText"));
	if(!skill){
		circle.fire('click');
	}
	//console.log(circle);
	return circle;
}

function updateLinePosition(circle1,circle2,line){
	let linePoints = [];
	if(circle1.getAttr('y') + defHeight + interval >= circle2.getAttr('y') && circle1.getAttr('y') - defHeight - interval < circle2.getAttr('y')){
		if(circle1.getAttr('x') > circle2.getAttr('x')){
			linePoints = [
				circle1.getAttr('x'),
				circle1.getAttr('y') + circle1.getAttr('height'),
				circle2.getAttr('x')  + circle2.getAttr('width'),
				circle2.getAttr('y') + circle1.getAttr('height')];
		}
		else{
			linePoints = [
				circle1.getAttr('x') + circle1.getAttr('width'),
				circle1.getAttr('y') + circle1.getAttr('height'),
				circle2.getAttr('x'),
				circle2.getAttr('y') + circle1.getAttr('height')];
		}
	}
	else if(circle2.getAttr('y') > circle1.getAttr('y')){
		linePoints = [
			circle1.getAttr('x') + circle1.getAttr('width'),
			circle1.getAttr('y') + circle1.getAttr('height'),
			circle2.getAttr('x')  + circle2.getAttr('width'),
			circle2.getAttr('y')]
	}
	else{
		linePoints = [
			circle1.getAttr('x') + circle1.getAttr('width'),
			circle1.getAttr('y'),
			circle2.getAttr('x')  + circle2.getAttr('width'),
			circle2.getAttr('y') + circle2.getAttr('height')];
	}
	//test
	linePoints = [
			circle1.getAttr('x'),
			circle1.getAttr('y'),
			circle2.getAttr('x'),
			circle2.getAttr('y')];
	//fin test
	line.setAttr("points",linePoints);
}

function createLine(circle1,circle2){
	let line = new Konva.Line({
		stroke: "black",
	});
	updateLinePosition(circle1,circle2,line);
	let childFound = false;
	let parentFound = false;
	circle1.getAttr("linkedSkill").childs.forEach(function(chld){
		if(chld.id == circle2.getAttr("linkedSkill").id){
			chld.line = line;
			childFound = true;
		}
	});
	circle2.getAttr("linkedSkill").parents.forEach(function(prt){
		if(prt.id == circle1.getAttr("linkedSkill").id){
			prt.line = line;
			parentFound = true;
		}
	});
	if(!childFound){
		circle1.getAttr("linkedSkill").childs.push({
			id : circle2.getAttr("linkedSkill").id,
			line : line
		});
	}
	if(!parentFound){
		circle2.getAttr("linkedSkill").parents.push({
			id : circle1.getAttr("linkedSkill").id,
			line : line
		});
	}
	layer.add(line);
	line.setZIndex(0);
}

function drawLinks(){
	circles.forEach(function (circle){
		let skill = circle.getAttr('linkedSkill');
		skill.parents.forEach(function (parentSkill){
			let parentRect = skillsToRect[parentSkill.id];
			createLine(parentRect,circle);
		});
	});
}

function getClassRoot(){
	let classRoot = {};
	classRoot.displayName = document.getElementById("className").value;
	let skillCollection = [];
	circles.forEach(function (circle){
		let curSkill = JSON.parse(JSON.stringify(circle.getAttr("linkedSkill")));
		curSkill.posX = circle.getAttr('x');
		curSkill.posY = circle.getAttr('y');
		curSkill.parents.forEach(function (skl){
			delete skl.line;
		});
		curSkill.childs.forEach(function (skl){
			delete skl.line;
		});
		skillCollection.push(curSkill);
	});
	classRoot.skills = skillCollection;
	classRoot.xOffset = stage.x();
	classRoot.yOffset = stage.y();
	classRoot.scale = stage.scaleX();
	return classRoot;
}

function saveClass(){
	let classRoot = getClassRoot();
	downloadObjectAsJson(classRoot,classRoot.displayName);
}

function loadData(mindJson){
		circles = [];
		skillToRect = {};
		layer.destroyChildren();
		let classConfig = mindJson;
		if(classConfig.className){
			adaptOldFormat(classConfig);
		}
		document.getElementById("className").value = classConfig.displayName;
		let initPosX = 0;
		let initPosY = 0;
		classConfig.skills.forEach(function(skill){
			let posX;
			let posY;
			if(skill.posX){
				posX = skill.posX;
				posY = skill.posY;
			}
			else{
				posX = initPosX;
				initPosX += 35;
				if(initPosX >= 500){
					initPosX = 0;
					initPosY += 35;
				}
				posY = initPosY;
			}
			makeSkill(posX,posY,skill);
		});
		drawLinks();
		currentSkill = null;
		currentRect = null;
		stage.x(classConfig.xOffset);
		stage.y(classConfig.yOffset);
		stage.scale(classConfig.scale ? {x:classConfig.scale,y:classConfig.scale} :{x:1,y:1});
		document.forms["skill"].style.display = "none";
	}

function loadClass(){
	let fileInput = document.getElementById("extFile");
	let reader = new FileReader();
	reader.readAsText(fileInput.files[0],'UTF-8');
	reader.onload = function(e){
		loadData(JSON.parse(e.target.result));
	}
}

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

addEventListener("DOMContentLoaded", (ev) => {
    fetch("VEILLE.json")
        .then(response => response.json())
        .then(data => {
            loadData(data);
        })
        .catch(error => alert("Erreur : " + error));
});




