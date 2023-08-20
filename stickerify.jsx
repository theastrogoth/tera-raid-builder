#target photoshop
// requires Script-Listener Plugin
// run with Photoshop 2022 on MacOS via Rosetta

app.preferences.rulerUnits = Units.PIXELS;

const standard_content_size = 550;
const black_trim_width = 5;
const white_trim_width = 20;
const sticker_size = standard_content_size + black_trim_width * 2 + white_trim_width * 2;

function selectLayerPixels() {
    var id710 = charIDToTypeID("setd");
    var desc168 = new ActionDescriptor();
    var id711 = charIDToTypeID("null");
    var ref128 = new ActionReference();
    var id712 = charIDToTypeID("Chnl");
    var id713 = charIDToTypeID("fsel");
    ref128.putProperty(id712, id713);
    desc168.putReference(id711, ref128);
    var id714 = charIDToTypeID("T   ");
    var ref129 = new ActionReference();
    var id715 = charIDToTypeID("Chnl");
    var id716 = charIDToTypeID("Chnl");
    var id717 = charIDToTypeID("Trsp");
    ref129.putEnumerated(id715, id716, id717);
    desc168.putReference(id714, ref129);
    executeAction(id710, desc168, DialogModes.NO);
}

function cropToSelection(top, left, bottom, right) {
    var idCrop = charIDToTypeID("Crop");
    var desc11 = new ActionDescriptor();
    var idT = charIDToTypeID("T   ");
    var desc12 = new ActionDescriptor();
    var idTop = charIDToTypeID("Top ");
    var idPxl = charIDToTypeID("#Pxl");
    desc12.putUnitDouble(idTop, idPxl, top);
    var idLeft = charIDToTypeID("Left");
    var idPxl = charIDToTypeID("#Pxl");
    desc12.putUnitDouble(idLeft, idPxl,left);
    var idBtom = charIDToTypeID("Btom");
    var idPxl = charIDToTypeID("#Pxl");
    desc12.putUnitDouble(idBtom, idPxl, bottom);
    var idRght = charIDToTypeID("Rght");
    var idPxl = charIDToTypeID("#Pxl");
    desc12.putUnitDouble(idRght, idPxl, right);
    var idRctn = charIDToTypeID("Rctn");
    desc11.putObject(idT, idRctn, desc12);
    var idAngl = charIDToTypeID("Angl");
    var idAng = charIDToTypeID("#Ang");
    desc11.putUnitDouble(idAngl, idAng, 0.000000);
    var idDlt = charIDToTypeID("Dlt ");
    desc11.putBoolean(idDlt, false);
    var idcropAspectRatioModeKey = stringIDToTypeID("cropAspectRatioModeKey");
    var idcropAspectRatioModeClass = stringIDToTypeID("cropAspectRatioModeClass");
    var idtargetSize = stringIDToTypeID("targetSize");
    desc11.putEnumerated(idcropAspectRatioModeKey, idcropAspectRatioModeClass, idtargetSize);
    executeAction(idCrop, desc11, DialogModes.NO);
}

function squareDoc(doc) {
    doc.resizeCanvas(Math.max(doc.width,doc.height),Math.max(doc.width,doc.height));
}

function standardizeImageSize(doc) {
    doc.resizeImage(standard_content_size, standard_content_size);
}

function expandCanvasForSticker(doc) {
    doc.resizeCanvas(sticker_size, sticker_size);
}

function resizeImage(doc) {
    squareDoc(doc);
    standardizeImageSize(doc);
    expandCanvasForSticker(doc);
}

function addStroke(size, color, opacity, position) {
    var strokePosCharID;
    switch(position) {
        case 'center':
            strokePosCharID = 'CtrF';
            break;
        case 'outside':
            strokePosCharID = 'OutF';
            break;
        case 'inside':
            strokePosCharID = 'InsF';
            break;
        default: break; 
    }
    var desc = new ActionDescriptor();
    var ref190 = new ActionReference();
    ref190.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Lefx"));
    ref190.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    desc.putReference(charIDToTypeID("null"), ref190);
    var fxDesc = new ActionDescriptor();
    var fxPropDesc = new ActionDescriptor();
    fxPropDesc.putBoolean(charIDToTypeID("enab"), true);
    fxPropDesc.putBoolean(stringIDToTypeID("present"), true);
    fxPropDesc.putBoolean(stringIDToTypeID("showInDialog"), true);
    fxPropDesc.putEnumerated(charIDToTypeID("Styl"), charIDToTypeID("FStl"), charIDToTypeID(strokePosCharID));
    fxPropDesc.putEnumerated(charIDToTypeID("PntT"),  charIDToTypeID("FrFl"), charIDToTypeID("SClr"));
    fxPropDesc.putEnumerated(charIDToTypeID("Md  "), charIDToTypeID("BlnM"), charIDToTypeID("Nrml"));
    fxPropDesc.putUnitDouble(charIDToTypeID("Opct"), charIDToTypeID("#Prc"), opacity);
    fxPropDesc.putUnitDouble(charIDToTypeID("Sz  "), charIDToTypeID("#Pxl") , size);
    var colorDesc = new ActionDescriptor();
    colorDesc.putDouble(charIDToTypeID("Rd  "), color.red);
    colorDesc.putDouble(charIDToTypeID("Grn "), color.green);
    colorDesc.putDouble(charIDToTypeID("Bl  "), color.blue);
    fxPropDesc.putObject(charIDToTypeID("Clr "), charIDToTypeID("RGBC"), colorDesc);
    fxPropDesc.putBoolean(stringIDToTypeID("overprint"), false);
    fxDesc.putObject(charIDToTypeID("FrFX"), charIDToTypeID("FrFX"), fxPropDesc);
    desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Lefx"), fxDesc);
    executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

function rasterizeLayer() {
    var idrasterizeLayer = stringIDToTypeID("rasterizeLayer");
    var desc5 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref4 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref4.putEnumerated(idLyr, idOrdn, idTrgt);
    desc5.putReference(idnull, ref4);
    var idWhat = charIDToTypeID("What");
    var idrasterizeItem = stringIDToTypeID("rasterizeItem");
    var idlayerStyle = stringIDToTypeID("layerStyle");
    desc5.putEnumerated(idWhat, idrasterizeItem, idlayerStyle);
    executeAction(idrasterizeLayer, desc5, DialogModes.NO);
}

function makeSticker(file) {
    var doc = app.open(file);
    app.activeDocument = doc;

    selectLayerPixels();
    var bound = doc.selection.bounds;
    cropToSelection(bound[1], bound[0], bound[3], bound[2]);

    var doc = activeDocument;
    resizeImage(doc);

    var strokeColor = new RGBColor();
    strokeColor.hexValue = '000000';
    addStroke(black_trim_width, strokeColor, 100, 'outside');

    rasterizeLayer();

    var strokeColor = new RGBColor();
    strokeColor.hexValue = 'ffffff';
    addStroke(white_trim_width, strokeColor, 100, 'outside');

    return doc;
}

function stickerifyFolder(folder, outputFolder) {
    originalFiles = folder.getFiles("*.png");
    for (var i = 0; i < originalFiles.length; i++) {
        var doc = makeSticker(originalFiles[i]);
        var outputFile = new File(outputFolder + "/" + originalFiles[i].name);
        var options = new PNGSaveOptions();
        doc.saveAs(outputFile, options);
        doc.close(SaveOptions.DONOTSAVECHANGES);
    }
}

var artOriginalsFolder = Folder("");
var artStickersFolder = Folder("");

var shinyArtOriginalsFolder = Folder("");
var shinyArtStickersFolder = Folder("");

stickerifyFolder(artOriginalsFolder, artStickersFolder);
stickerifyFolder(shinyArtOriginalsFolder, shinyArtStickersFolder);