var SNIPPETDATA = [];
var SNIPPETS = [];
var SNIPPETAPPLY = {};
var SNIPPETCATEGORIES = [];
var SNIPPETCATEGORY = "";
var SNIPPETBUFFER = [];
var SNIPPETPOSITION = -1;

function ctrlC(target){
    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(target));
        range.select().createTextRange();
        document.execCommand("Copy");
    } else if (window.getSelection) {
        window.getSelection().removeAllRanges();
        var range = document.createRange();
        range.selectNode(document.getElementById(target));
        window.getSelection().addRange(range);
        document.execCommand("Copy");
    }
}

function ctrlC2Buffer(target){
    var text = $("#"+target).text();
    var lines = text.split("\n");
    if(lines!=null&&lines.length>0){
        var pos = SNIPPETPOSITION;
        if(pos!=-1 && pos<SNIPPETBUFFER.length){
            SNIPPETPOSITION += lines.length;
        }
        else{
            pos = SNIPPETBUFFER.length;
        }
        var indent = "";
        var indentLength = $("#snippetIndent").val()*3;
        if(indentLength>0){
            for(var i=0;i<indentLength;i++){
                indent=indent+" ";
            }
        }
        if(pos<SNIPPETBUFFER.length){
            for(var i=0;i<lines.length;i++){
                SNIPPETBUFFER.splice(pos, 0, indent+lines[i]);
                pos++;
            }
        }
        else{
            for(var i=0;i<lines.length;i++){
                SNIPPETBUFFER.push(indent+lines[i]);
            }
        }
    }
    buildSnippetBuffer();
}

function buildSnippetBuffer(){
    var sb=[];
    sb.push("<table class='width100'>");
    sb.push("<tbody>");
    for(var i=0;i<=SNIPPETBUFFER.length;i++){
        var j = -1;
        var line = "";
        if(SNIPPETBUFFER.length>i){
            j = i;
            line = SNIPPETBUFFER[i];
        }
        var bufferRow = "buffer-row";
        if (SNIPPETPOSITION == j) {
            bufferRow = bufferRow + " buffer-row-selected";
        }
        sb.push("<tr id='snippetLine" + j + "' onclick='snippetBufferLine(" + j +")' class='"+bufferRow+"'>");
        sb.push("<td style='width: 1px; '>&nbsp;</td>");
        sb.push("<td class='buffer-line'>");
        sb.push(escapeHtml(line));
        sb.push("</td>");
        sb.push("</tr>");
    }
    sb.push("</tbody>");
    sb.push("</table>");
    $("#snippetBufferBody").html(sb.join("\n"));
}

function selectSnippetCategoryChanged(){
    var cat = $("#selectSnippetCategory").val();
    var sb=[];
    for(var i=0;i<SNIPPETDATA.length;i++){
        if(SNIPPETDATA[i].category==cat){
            sb.push("<option value='"+i+"'>"+SNIPPETDATA[i].name+"</option>");
        }
    }
    $("#selectSnippetName").html(sb.join("\n"));
    selectSnippetNameChanged();
}

function selectSnippetNameChanged(){
    var idx = $("#selectSnippetName").val();
    if(idx>=0 && SNIPPETDATA.length>idx){
        snippetApply(SNIPPETDATA[idx]);
    }
}

function snippetBufferChanged(){
    var text = $("#snippetBufferCode").val();
    console.log(text);
    SNIPPETBUFFER = text.split("\n");
}

function snippetBufferLine(lineNo){
    $("#snippetLine" + SNIPPETPOSITION).removeClass("buffer-row-selected");
    SNIPPETPOSITION = lineNo;
    $("#snippetLine" + SNIPPETPOSITION).addClass("buffer-row-selected");

}

function showAlert(type, autoClose, message){
    $("#alertMe").html('<div class="alert alert-dismissible alert-'+type+'" style="padding-top: 2px; padding-bottom: 2px; margin-top: 12px; margin-bottom: 0px;"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>'+message+'</div>');
    if(autoClose){
        $(".alert-dismissible").fadeTo(2000, 500).slideUp(500, function(){
            $(".alert-dismissible").alert('close');
        });
    }
}

function clearAlert(){
    $("#alertMe").empty();
}

function pullSnippets(){
    $.ajax({
        type: "GET",
        url: "/assets/scripts/data2.json",
        success: function(data)
        {
            console.log(data);
            if(data != null){
                SNIPPETDATA = data;
                analyzeSnippetData();
                buildSnippetCategories();
            }
        },
        error: function(err){
            console.log(err);
        }
    });
}

function checkSnippetCategoryExists(cat){
    var found = false;
    for (var j = 0; j < SNIPPETCATEGORIES.length; j++) {
        if (SNIPPETCATEGORIES[j] == cat) {
            found = true;
            break;
        }
    }
    return found;
}

function analyzeSnippetData(){
    SNIPPETCATEGORIES.length=0;
    for(var i=0;i<SNIPPETDATA.length;i++){
        var category = SNIPPETDATA[i].category;
        if (!checkSnippetCategoryExists(category)){
            SNIPPETCATEGORIES.push(category);
        }
    }
}

function buildSnippetCategories(){
    var ob=[];
    var sb=[];
    var cats=SNIPPETDATA;
    sb.push('<ul class="nav nav-pills">');
    for(var i=0;i<SNIPPETCATEGORIES.length;i++){
        var cat = SNIPPETCATEGORIES[i];
        if(SNIPPETCATEGORY==null||SNIPPETCATEGORY.length==0||SNIPPETCATEGORY==cat){
            SNIPPETCATEGORY = cat;
            sb.push('<li class="nav-item active" style="cursor: pointer;">');
        }
        else{
            sb.push('<li style="cursor: pointer;">');
        }
        sb.push('<a data-toggle="tab" onclick="buildSnippets(\''+cat+'\');">');
        sb.push(cat);
        sb.push('</a>');
        sb.push('</li>');
        ob.push("<option value='"+cat+"'>"+cat+"</option>");
    }
    sb.push('</ul>');
    $("#snippetPills").html(sb.join("\n"));
    $("#selectSnippetCategory").html(ob.join("\n"));
    if(SNIPPETCATEGORY!=null){
        buildSnippets(SNIPPETCATEGORY);
        $("#selectSnippetCategory").val(SNIPPETCATEGORY);
        selectSnippetCategoryChanged();
    }
}

function escapeHtml(code){
     return $('<div/>').text(code).html();
}

function buildSnippets(cat){
    var sb=[];
    var snippets = SNIPPETDATA;
    if(snippets!=null){
        SNIPPETCATEGORY = cat;
        var i=0;
        for (var j = 0; j < snippets.length;j++){
            var snippet = snippets[j];
            if(snippet.category!=cat){
                continue;
            }
            var name = snippet.name;
            sb.push('<div style="');
            if(i>0){
                sb.push('margin-top: 15px; padding-top: 15px; border-top: 1px dashed gray;');
            }
            i++;
            sb.push('">');
            sb.push('<div style="padding: 0px;">');
            sb.push('<a style="text-decoration: underline; margin-top: 0px; font-weight: bold; font-size: larger; color: gray; margin-right: 10px;" href="javascript:snippetAction(0, \'' + cat + '\',\'' + snippet.name + '\',' + j +')">');
            sb.push(snippet.name);
            sb.push('</a>');
            sb.push('<span class="glyphicon glyphicon-pencil" style="color: teal; margin-left: 1px; cursor: pointer;" onclick="snippetAction(1, \'' + cat + '\',\'' + snippet.name + '\',' + j +')"></span>');
            sb.push('<span class="glyphicon glyphicon-remove-sign" style="color: darkred; margin-left: 1px; cursor: pointer;" onclick="snippetAction(2, \'' + cat + '\',\'' + snippet.name + '\',' + j +')"></span>');
            sb.push('</div>');
            sb.push("<div>");
            sb.push(snippet.description);
            sb.push("</div>");

            sb.push('<div style="font-family: monospace; white-space: pre; width: 100%; overflow-x: hidden; overflow-y: auto;">');
            var data = snippetCodeParams(snippet.code, snippet.paramInfo, false);
            var code = snippetSubstitute(snippet.code, data);
            code = escapeHtml(code);
            sb.push(code);
            sb.push('</div>');
            sb.push('</div>');

        }
    }
    $("#snippetList").html(sb.join("\n"));
}

function snippetRemoveTags(text){
    return text.replace(/\[#\]/g,"").replace(/\[\/#\]/g,"");
}

function snippetCodeParams(code, paramText, alertOnError){
    var paramNames = code.match(/\[#\](.*?)\[\/#\]/g);
    if(paramNames!=null&&paramNames.length>0){
        for(var i=0;i<paramNames.length;i++){
            if(paramNames[i]!=null&&paramNames[i].length>0){
                paramNames[i]=snippetRemoveTags(paramNames[i]);
            }
        }
    }
    var data={};
    if(paramText!=null&&paramText.length>0){
        try{
            data=JSON.parse(paramText);
        }
        catch(e){
            if(alertOnError){
                showAlert("danger", false, "current parameter value is invalid - fix or clear and try again.");
                return;
            }
        }
    }
    for(var i=0;i<paramNames.length;i++){
        var paramName=paramNames[i];

        if(paramName!=null&&paramName.length>0){
            var paramText = {
                label: paramName,
                value: paramName,
                multiline: false,
                prefix: "",
                suffix: "",
                options: null
            };
            if(data[paramName]==null){
                data[paramName]={};
            }
            for(var prop in paramText){
                if(data[paramName][prop]==null){
                    data[paramName][prop]=paramText[prop];
                }
            }
        }
    }
    return data;
}

function snippetAction(action, cat, name, idx){
    var snippet = null;
    if(idx>=0&&idx<SNIPPETDATA.length){
        snippet=SNIPPETDATA[idx];
    }
    if(snippet!=null){
       if(action==0){
          snippetApply(snippet, true);
       }
       else if(action==1){
          snippetEdit(snippet, idx);
       }
       else if(action==2){
          if(window.confirm("Are you sure you want to delete snippet "+name)){
            snippetDelete(snippet, idx);
          }
       }
    }
}

function snippetSubstitute(code, data){
    if(data!=null){
        var codeArray = null;
        for(var prop in data){
            var propValue = data[prop];
            var value = propValue.value;
            if(value!=null&&value.length>0){
                value = propValue.prefix+value+propValue.suffix;
            }
            var target = '[#]'+prop+'[/#]';
            codeArray = code.split(target);
            code = codeArray.join(value);
        }
        codeArray = code
            .split("\n")
            .map(function(p){
                return p.replace(/\s+$/g, '');
            })
            .filter(function(p){
                return (p != null && p.length > 0);
            });
        code = codeArray.join("\n");
    }
    return code;
}

function snippetUpdate(){
    var code = SNIPPETAPPLY.snippet.code;
    var formData=SNIPPETAPPLY.paramData;
    if(formData!=null){
        for(var prop in formData){
            var fldName = "xxSnippet"+prop;
            var propValue = formData[prop];
            var value = $("#"+fldName).val();
            if(propValue.options!=null){
                for(var i=0;i<propValue.options.length;i++){
                    var option=propValue.options[i];
                    if(option != null && option.text != null && option.name == value){
                        value = option.text;
                        break;
                    }
                }

            }
            propValue.value = value;
        }
    }
    code = snippetSubstitute(code, formData);
    $("#snippetGeneratedCode").text(code);
}

function snippetApply(snippet, show){
    SNIPPETAPPLY = {
        snippet: snippet,
        paramData: snippetCodeParams(snippet.code, snippet.paramInfo, false)
    };
    var sb=[];
    sb.push('<form class="form-horizontal" id="formSnippet">');
    for(var prop in SNIPPETAPPLY.paramData){
        var fldName = "xxSnippet"+prop;
        var fldValue = SNIPPETAPPLY.paramData[prop];
        sb.push('<div class="form-group">');
        sb.push('<label class="col-xs-12" for="'+fldName+'">'+fldValue.label+':</label>');
        sb.push('<div class="col-xs-12">');
        if(fldValue.options==null){
            if(fldValue.multiline==true){
                sb.push('<textarea class="form-control" onkeyup="snippetUpdate()" onchange="snippetUpdate()" rows="5" name="'+fldName+'" id="'+fldName+'">'+fldValue.value+'</textarea>');
            }
            else{
                sb.push('<input type="text" class="form-control" onkeyup="snippetUpdate()" onchange="snippetUpdate()" name="'+fldName+'" id="'+fldName+'" value="'+fldValue.value+'">');
            }
        }
        else{
            sb.push('<select class="form-control" onchange="snippetUpdate()" name="'+fldName+'" id="'+fldName+'" value="'+fldValue.value+'">');
            for(var i=0;i<fldValue.options.length;i++){
                var option=fldValue.options[i];
                if(option != null && option.name != null && option.text != null){
                    sb.push('<option value="'+option.name+'">');
                    sb.push(option.name);
                    sb.push('</option>');
                }
            }
            sb.push('</select>');
        }
        sb.push('</div>');
        sb.push('</div>');
    }
    $("#snippetForms").html(sb.join("\n"));
    snippetUpdate();
    buildSnippetBuffer();
    if(show){
        $('#snippetModal').modal({
            show: true
        });
    }
}

function snippetEdit(snippet, idx){
    if(snippet!=null){
        $("#idx").val(idx);
        $("#name").val(snippet.name);
        $("#category").val(snippet.category);
        $("#description").val(snippet.description);
        $("#code").val(snippet.code);
        $("#paramInfo").val(snippet.paramInfo);
        snippetEditor(true);
    }
}

function snippetDelete(snippet, idx){
    if(snippet!=null && idx>=0 && SNIPPETDATA.length>idx){
        SNIPPETDATA.splice(idx, 1);
        buildSnippets(SNIPPETCATEGORY);
    }
}

function snippetEditor(open){
    if (open) {
        $('#snippetEditor').modal({
            show: true
        });
    }
}

function snippetReady(){
    $("#btnSnippetBufferClear").click(function () {
        SNIPPETBUFFER.length = 0;
        SNIPPETPOSITION = -1;
        $("#snippetBufferCode").val(SNIPPETBUFFER.join("\n"));
    });

    $("#btnSnippetBuffer").click(function () {
        $("#snippetBufferCode").val(SNIPPETBUFFER.join("\n"));
        $('#snippetBufferModal').modal({
            show: true
        });
    });

    $("#btnGenerate").click(function () {
        var data = {
            moduleCode: $("#moduleCode").val(),
            moduleTitle: $("#moduleTitle").val(),
            noIncludeCancel: $("#noIncludeCancel").prop("checked"),
            indexData: $("#indexData").val(),
            viewGraphUrl: $("#viewGraphUrl").val(),
            viewKey: $("#viewKey").val(),
            viewSections: $("#viewSections").val()
        };
        localStorage.setItem("genInfo", JSON.stringify(data));
    });

    $("#btnSnippetNew").click(function (){
        var snippet = {
            name: "",
            category: "",
            description: "",
            code: "",
            paramInfo: ""
        };
        snippetEdit(snippet, -1);
    });

    $("#btnAddSnippet").click(function (e) {
        var idx = $("#idx").val();
        var savedata = {
            name: $("#name").val(),
            category: $("#category").val(),
            description: $("#description").val(),
            code: $("#code").val(),
            paramInfo: $("#paramInfo").val()
        };

        if(idx>=0&&SNIPPETDATA.length>idx){
            SNIPPETDATA[idx]=savedata;
        }
        else{
            idx = SNIPPETDATA.length;
            $("#idx").val(idx);
            SNIPPETDATA.push(savedata);
        }
        var cat = savedata.category;
        if(!checkSnippetCategoryExists(cat)){
            SNIPPETCATEGORIES.push(cat);
            buildSnippetCategories();
        }
        buildSnippets(SNIPPETCATEGORY);
        e.preventDefault();
    });

    $("#btnSnippetExport").click(function (e){
        var text = JSON.stringify(SNIPPETDATA, null, "   ");
        var uricontent = "data:application/octet-stream," + encodeURIComponent(text);
        var anchor = document.createElement('a');
        anchor.setAttribute("download", "codesnippets.json");
        anchor.setAttribute("href", uricontent);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    });


    $("#btnUpdateParameterInfo").click(function (e) {
        var code = $("#code").val();
        var paramText = $("#paramInfo").val();
        var data = snippetCodeParams(code, paramText, true);
        paramText = JSON.stringify(data, null, '   ');
        $("#paramInfo").val(paramText);
    });

    pullSnippets();
}
