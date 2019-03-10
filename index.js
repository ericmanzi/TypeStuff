/**
 * Created by ericmanzi on 1/23/16.
 */
// textarea = document.getElementById('content');
textarea = document.getElementById('textarea-label');
// textarea = document.body;
hr = '_____________________________________________________________________________'
hr2 = '==============================================================================='
focusNodeId = 0;
drawLineRegex = /^(_){3}$/g;
linkRegex = /\[([^\[]+)\]\{([^\}]+)\}/g;
linkRegexAnchor = /\[([^\[]+)\]\{([^\}]+)\}/g;
selected_note = "stuff";
selected_note_0 = "stuff";
selected_note_ref_id = 'content';
dataPlaceholder = "type stuff... and add inline links as in markdown:"+
" [an example]{https://example.com}";
controlsTimeout = null;
binaryAgent = dataPlaceholder;
hidd=['notes', 'docs'];

function resizeBox() {
    var windowWidth = window.innerWidth - 85;
    Array.prototype.slice.call(document.getElementsByClassName('noteContent'),0).forEach((notediv)=>{
        notediv.style.width = windowWidth;
    });
    // textarea.style.width = windowWidth;
}

function setZoom(currentZoom, mycallback) {
    document.body.style.fontSize=currentZoom+"%";
    chrome.storage.local.set({typedstuff_zoom: currentZoom}, function () {
        //console.log("saved zoom:"+currentZoom);
        if (mycallback) mycallback();
    });
}

function modified_sha128(txt) {
    var hash = "";
    for (var i=0; i<txt.length; i++) {
        var j=binaryAgent.indexOf(txt[i]); var binaryCode=Number(j).toString(2); var binSize=binaryCode.length;
        var pad = ""; for (var k=0; k<=Number.parseInt(Math.sqrt(256)/2)-binSize; k++) { pad+="0"; }
        hash = hash+(hash==""?"":"-")+pad+binaryCode;
    }
    return hash;
}

function replacer(match, p1, p2, p3, offset, string) {
    return '<div contenteditable="false"><a href="'+p2+'">'+p1+'</a></div>&nbsp';
}

function replaceLink(content) {
    var regex = /\[([^\[]+)\]\{([^\}]+)\}/g;
    var new_string = content.replace(regex, replacer);
    return new_string;
}

function switchToNote(note) {
    // unselect other cells
    var notes = Array.prototype.slice.call(document.getElementsByClassName('note'), 0);
    selected_note = note.textContent;

    var all_notes = Array.prototype.slice.call(document.getElementsByClassName('note'), 0);
    all_notes.forEach((nx)=>{ nx.className = 'note'; });
    note.className = 'note selected';

    var refNoteId = note.getAttribute('refnoteid');
    console.log("refNoteId:"+refNoteId);
    var all_note_divs = Array.prototype.slice.call(document.getElementsByClassName('noteContent'), 0);
    all_note_divs.forEach((nd)=> {
        nd.style.display = 'none';
    });
    document.getElementById(refNoteId).style.display="block";

    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(()=>{ hideControls(); }, 10000);
}

function registerNotesHandler() {

    document.getElementById('new').onclick = function(e) {
        var new_note = document.createElement('span')
        new_note.className = "note"
        // new_note.textContent = "untitled"
        var noteId = (new Date()).getTime();
        new_note.setAttribute('notename', 'untitled')
        new_note.setAttribute('refnoteid', noteId)
        new_note.setAttribute('contenteditable', 'true')
        new_note.setAttribute('data-placeholder', 'new note')
        e.target.parentNode.appendChild(new_note)
        registerNotesHandler();

        var newNoteDiv = document.createElement('div');
        newNoteDiv.id = noteId;
        newNoteDiv.setAttribute('contenteditable','true')
        newNoteDiv.setAttribute('spellcheck','false')
        newNoteDiv.setAttribute('data-placeholder',dataPlaceholder)
        newNoteDiv.className = "noteContent"
        newNoteDiv.style.display = "none"
        document.getElementById('textarea-label').appendChild(newNoteDiv);

    }


    var notes = Array.prototype.slice.call(document.getElementsByClassName('note'), 0);
    notes.forEach((n)=> {
        if (n.id == "new") {
            return;
        }
        
        (function(note){
            note.onclick = function() {
                clicked_note = note.textContent;
                
                if (hidd.indexOf(clicked_note) > -1) {
                    passwd = window.prompt("Authentication:", "") || "";
                    if (modified_sha128(passwd) == modified_sha128(selected_note_0)) {
                        switchToNote(note);
                    }
                    setTimeout(()=>{
                        switchToNote(notes[1]);
                    }, 5*60*1000);
                } else {
                    switchToNote(note);
                }
                
                
            }
            note.ondblclick = function(e) {
                note.setAttribute('contenteditable', 'true')
            }
            note.addEventListener('keydown', function(e) {
                if (e.which === 13) { // on enter
                    e.stopPropagation();
                    e.preventDefault();
                    note.setAttribute('contenteditable', 'false')
                    note.setAttribute('notename', note.textContent)
                    return false;
                }
            })
        })(n);
    });

    setTimeout(()=>{
        // var current_note = Array.prototype.slice.call(document.getElementsByClassName('note selected'), 0)[0].textContent;
        if (hidd.indexOf(selected_note) > -1) { 
            switchToNote(notes[1]); 
            // console.log('switchToNote');
        }
    },1);
}

function hideControls() {
    document.getElementById('controls').className='';
    controlsTimeout = setTimeout(()=>{
        hideControls();
    }, 20000)
}

(function() {

    resizeBox();

    window.onresize = resizeBox;

    var currentZoom;

    chrome.storage.local.get('typedstuff_style', function(data) {
        document.body.className = data.typedstuff_style || 'terminal';
        
        Array.prototype.slice.call(document.getElementsByTagName('button'),0)
            .filter((function(x) {
                return x.className === document.body.className;
            }))[0].className+=" selected";


        chrome.storage.local.get('typedstuff_zoom', function (data) {
            currentZoom = data.typedstuff_zoom || 100;
            setZoom(currentZoom, function() {

                chrome.storage.local.get('typedstuff_text', function (data) {
                    textarea.innerHTML = data.typedstuff_text || textarea.innerHTML;
                    console.log(textarea.innerHTML);
                    chrome.storage.local.get('typedstuff_last_save', function (data) {
                        lastSave = data.typedstuff_last_save || (new Date()).getTime();

                        chrome.storage.local.get('typedstuff_notes_nav', function (data) {
                            if (data != undefined && data != null && data != "") {
                                
                                document.getElementById("notesNavigator").innerHTML = data.typedstuff_notes_nav;
                                
                                // chrome.storage.local.get('typestuff_selected_note', function(data) {
                                //     selected_note = data.typestuff_selected_note || 'stuff';
                                    registerNotesHandler();
                                // });

                            }
                                               
                        });
                    });
                });
            });
        });
    });

    textarea.addEventListener('keydown', function(e) {
        // console.log(e.which)
        var anchor = window.getSelection().anchorNode;
        
        focusNodeId = (new Date()).getTime();
        // window.getSelection().anchorNode.parentNode.id = focusNodeId;
        var content = textarea.innerHTML;
                
        if (e.shiftKey) {
            if (e.which == 221) {
                console.log("keypress }")
                // console.log(anchor.parentNode.previousSibling.textContent);
                // console.log(anchor.data);
                // console.log(anchor.parentNode);
                if (linkRegexAnchor.test(anchor.data+"}")) {
                    //console.log("found link");
                    // setTimeout(()=>{
                        // console.log(anchor.data);
                        // console.log(anchor.parentNode);
                        var newContent = replaceLink(anchor.data+"}");
                        // console.log(newContent)
                        anchor.parentNode.innerHTML = newContent;
                        e.preventDefault();
                        e.stopPropagation();
                        // content = replaceLink(content);
                        // textarea.innerHTML = content;
                        // var el = document.getElementById(focusNodeId);
                        // var range = document.createRange();
                        // var sel = window.getSelection();
                        // range.setStart(el.childNodes[0], 0);
                        // range.collapse(true);
                        // sel.removeAllRanges();
                        // sel.addRange(range);
                        // el.focus();

                    // }, 1);
                }
                 /*else {
                    var previous = anchor.parentNode.previousSibling;
                    if (previous == null || previous.tagName !== 'SPAN') { return; }
                    var withPreviousSpan = previous.textContent + anchor.data;
                    if (linkRegex.test(withPreviousSpan)) {
                        //console.log("found link");
                        setTimeout(()=>{
                            var newContent = replaceLink(withPreviousSpan);
                            //console.log(newContent)
                            anchor.parentNode.innerHTML = newContent;
                        }, 0);
                    }
                }*/
            }
            if (e.which == 189) { // keypress "_"
                if (anchor.data == '___') {
                    setTimeout(() => { anchor.data = hr }, 0);
                }
                //if (drawLineRegex.test(content)) {
                    //content = drawLine(content);
                    //textarea.innerHTML = content;
                    //document.getElementById(focusNodeId).focus();    
                //}
            }



        }

        if (e.which == 9) {
            e.preventDefault();
            e.stopPropagation();
            var tab = document.createElement('SPAN');
            tab.style="white-space:pre";
            // var textnode = document.createTextNode("    ");
            var textnode = document.createTextNode("\t");
            tab.appendChild(textnode);
            // console.log(anchor.parentNode);
            anchor.parentNode.appendChild(tab);
            // console.log(anchor.parentNode);
            // var s = "&nbsp;"
            // var tab = s+s+s+s;
            // anchor.data += tab;
        }

        if (e.which == 17) {
            //console.log("ctrl");
            chrome.storage.local.set({typedstuff_text: content}, function () {
                console.log("saved content");
                lastSave = (new Date()).getTime();
                chrome.storage.local.set({typedstuff_last_save: lastSave}, function () {
                    var notesNavigator = document.getElementById('notesNavigator');
                    chrome.storage.local.set({typedstuff_notes_nav: notesNavigator.innerHTML}, function() {
                        // console.log("saved notes: "+notesNavigator.innerHTML);
                        chrome.storage.local.set({
                            typestuff_selected_note: selected_note
                        }, function () {
                            
                        });
                    })
                });
            });
        }


        if (e.which == 187) {
            if (anchor.data == '===') {
                setTimeout(() => { anchor.data = hr2 }, 0);
            }
        }
        // if (e.which == 9) {
        //     e.preventDefault();
        //     e.stopPropagation();
        //     anchor.data += "...";
        // }

        setTimeout(()=>{
            var timeSinceLastSave = (new Date()).getTime() - Number.parseInt(lastSave);
            if (timeSinceLastSave > (4*24*60*60*1000)) {
                var d = ":::::::::::::::::::::::::::::::::::::::::::::::";
                var d2 = d+d+d+d+d+d+d;
                var delimiter = d2+d2+d2;
                var new_content = content + delimiter;
                chrome.storage.local.get('typedstuff_backup', function (data) {
                    var backup = data.typedstuff_backup + new_content || new_content;
                    chrome.storage.local.set({typedstuff_backup: backup}, function () {
                        console.log("backed up");
                    });

                });


                //var fs = require('fs');
                //var new_filename = "/Users/ericmanzi/Desktop/project\ stuff/typestuff_files/"+focusNodeId+".txt";
                //fs.appendFile(new_filename, content, (err) => {
                    // if (err) throw err;
                // });
            } else if (timeSinceLastSave > 30000) {

                chrome.storage.local.set({typedstuff_text: content}, function () {
                    console.log("saved content");
                    lastSave = (new Date()).getTime();
                    chrome.storage.local.set({typedstuff_last_save: lastSave}, function () {
                        var notesNavigator = document.getElementById('notesNavigator');
                        chrome.storage.local.set({typedstuff_notes_nav: notesNavigator.innerHTML}, function() {
                            console.log("saved notes: "+notesNavigator);

                        })
                    });
                });
            }

            
        }, 1);
    });

    document.getElementById('bigger').onclick = function() {
        currentZoom+=10;
        setZoom(currentZoom);

    };

    document.getElementById('smaller').onclick = function() {
        currentZoom-=10;
        setZoom(currentZoom);
    };

    document.getElementById('settings').onclick = function() {
        if (document.getElementById('controls').className==='show') {
            document.getElementById('controls').className='';
        } else {
            clearTimeout(controlsTimeout);
            hideControls();
            document.getElementById('controls').className='show';
        }
    };


    document.getElementById('delete').onclick = function(e) {
        if (window.confirm("Are you sure you want to delete the current note '"+selected_note+"'?")) {
            // delete note
            var selectedNote = document.getElementsByClassName('note selected')[0];
            var refNoteId = selectedNote.getAttribute('refnoteid');
            var refNote = document.getElementById(refNoteId);

            selectedNote.parentNode.removeChild(selectedNote);
            refNote.parentNode.removeChild(refNote);

        }
    }



    registerNotesHandler();

    hideControls();

    var buttons = Array.prototype.slice.call(document.getElementsByTagName('button'), 0);
    for (var i=0; i<buttons.length; i++) {
        (function(index){
            buttons[index].onclick = function() {

                document.body.className = buttons[index].className.split(' ')
                .filter((classname) => classname !== 'selected')[0];

                chrome.storage.local.set({
                    typedstuff_style: buttons[index].className
                }, function () {
                    console.log("saved style");
                });

                for (var j=0; j<buttons.length; j++) {
                    if (j!==index) {
                        var new_classname = buttons[j].className.split(' ').filter(
                            function(classname) {
                                return classname !== 'selected';
                            }
                        )[0];
                        buttons[j].className = new_classname;
                    }
                }

                buttons[index].className += " selected";
            }
        })(i);
    }

})();
