const path = require('path');
const fs = require('fs');
const snippetsPath = path.join(__dirname, "snippets");

let files = fs.readdirSync(snippetsPath);
let data = [];
files.forEach(file => {
    let filePath = path.join(snippetsPath, file);
    let fileStats = fs.lstatSync(filePath);
    if(fileStats.isDirectory()){
        let catSnippets = {};
        let catFiles = fs.readdirSync(filePath);
        catFiles.forEach(catFile=>{
            let catFilePath = path.join(filePath, catFile);
            let catFileText = fs.readFileSync(catFilePath);
            if(catFileText!=''){
                let catFileData = JSON.parse(catFileText);
                if(catFileData!=null){
                    catFileData["name"] = path.parse(catFilePath).name;
                    data.push(catFileData);
                }
            }

        });
    }
});
console.log('writepath', );
fs.writeFileSync(path.join(__dirname, 'public/assets/scripts/data2.json'), JSON.stringify(data, null, '   '));