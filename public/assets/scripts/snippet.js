var SNIPPETS = [];
var SNIPPETAPPLY = {};
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
    sb.push("<table>");
    sb.push("<tbody>");
    for(var i=0;i<=SNIPPETBUFFER.length;i++){
        var j = -1;
        var line = "";
        if(SNIPPETBUFFER.length>i){
            j = i;
            line = SNIPPETBUFFER[i];
        }
        sb.push("<tr>");
        sb.push("<td style='width: 30px; text-align: center; border-right: 1px solid gold; padding-left:5px; padding-right: 5px; ' id='snippetLine"+j+"' onclick='snippetBufferLine("+j+")'>");
        if(SNIPPETPOSITION==j){
            sb.push("<span class='glyphicon glyphicon-play' style='color: green;'></span>");
        }
        else{
            sb.push("<span></span>");
        }
        sb.push("</td>");
        sb.push("<td style='width: 10px;'>&nbsp;</td>");
        sb.push("<td style='font-family: monospace; white-space: pre; padding: 0px; line-height: 0px;'>");
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
    var snippets = SNIPPETS[cat];
    if(snippets!=null){
        for(var name in snippets){
            sb.push("<option value='"+name+"'>"+name+"</option>");
        }
    }
    $("#selectSnippetName").html(sb.join("\n"));
    selectSnippetNameChanged();
}

function selectSnippetNameChanged(){
    var cat = $("#selectSnippetCategory").val();
    var name = $("#selectSnippetName").val();
    if(SNIPPETS!=null&&SNIPPETS[cat]!=null&&SNIPPETS[cat][name]!=null){
        snippetApply(SNIPPETS[cat][name], false);
    }

}

function snippetBufferChanged(){
    var text = $("#snippetBufferCode").val();
    console.log(text);
    SNIPPETBUFFER = text.split("\n");
}

function snippetBufferLine(lineNo){
    $("#snippetLine"+SNIPPETPOSITION).html("<span></span>");
    SNIPPETPOSITION = lineNo;
    $("#snippetLine"+SNIPPETPOSITION).html("<span class='glyphicon glyphicon-play' style='color: green;'></span>");
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
        url: "/assets/scripts/data.json",
        success: function(data)
        {
            console.log(data);
            if(data != null){
                SNIPPETS = data;
                buildSnippetCategories();
            }
        },
        error: function(err){
            console.log(err);
        }
    });

}

function buildSnippetCategories(){
    var ob=[];
    var sb=[];
    sb.push('<ul class="nav nav-pills nav-stacked">');
    for(var cat in SNIPPETS){
        if(SNIPPETCATEGORY==null||SNIPPETCATEGORY.length==0||SNIPPETCATEGORY==cat){
            SNIPPETCATEGORY = cat;
            sb.push('<li class="active" style="cursor: pointer;">');
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
    var snippets = SNIPPETS[cat];
    if(snippets!=null){
        SNIPPETCATEGORY = cat;
        var i=0;
        for(var name in snippets){
            var snippet = snippets[name];
            sb.push('<div style="');
            if(i>0){
                sb.push('margin-top: 15px; padding-top: 15px; border-top: 1px dashed gray;');
            }
            i++;
            sb.push('">');
            sb.push('<div style="padding: 0px;">');
            sb.push('<a style="margin-top: 0px; font-weight: bold; font-size: larger; color: gray; margin-right: 10px;" href="javascript:snippetAction(0, \''+cat+'\',\''+snippet.name+'\')">');
            sb.push(snippet.name);
            sb.push('</a>');
            sb.push('<span class="glyphicon glyphicon-pencil" style="color: gold; margin-left: 1px; cursor: pointer;" onclick="snippetAction(1, \''+cat+'\',\''+snippet.name+'\')"></span>');
            sb.push('<span class="glyphicon glyphicon-remove-sign" style="color: darkred; margin-left: 1px; cursor: pointer;" onclick="snippetAction(2, \''+cat+'\',\''+snippet.name+'\')"></span>');
            sb.push('</div>');
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

function snippetAction(action, cat, name){
    debugger;
    var snippet = null;
    if(SNIPPETS[cat]!=null){
        var namedSnippets = SNIPPETS[cat];
        snippet=namedSnippets[name];
    }
    if(snippet!=null){
       if(action==0){
          snippetApply(snippet, true);
       }
       else if(action==1){
          snippetEdit(snippet);
       }
       else if(action==2){
          if(window.confirm("Are you sure you want to delete snippet "+name)){
            snippetDelete(snippet);
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
        sb.push('<label class="control-label col-xs-3" for="'+fldName+'">'+fldValue.label+':</label>');
        sb.push('<div class="col-xs-9">');
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

function snippetEdit(snippet){
    if(snippet!=null){
        $("#name").val(snippet.name);
        $("#category").val(snippet.category);
        $("#code").val(snippet.code);
        $("#paramInfo").val(snippet.paramInfo);
        $("#overwrite").prop("checked", true);
        snippetEditor(true);
    }
}

function snippetDelete(snippet){
    if(snippet!=null){
        $.ajax({
            type: "GET",
            url: "/Default/DeleteSnippet?category="+snippet.category+"&name="+snippet.name,
            success: function(data)
            {
                showAlert("success",true, "snippet deleted!")
                pullSnippets();
            },
            error: function(err){
                showAlert("danger", false, "snippet could not be deleted - "+err.statusText);
                console.log(err);
            }
        });
    }

}

function snippetEditor(open){
    var isClosed = $('#snippetToggle').hasClass('collapsed');
    if(open==isClosed){
        $('#snippetToggle').click();
    }
}
