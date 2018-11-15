// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.


function fun1() {
    console.log("test")
    document.write("<p/>chrome: <b>" + process.versions.chrome + "</b>")
    document.write(" electron: <b>" + process.versions.electron + "</b>")
    document.write("<p/><i> hot hot hot .... </i>")
}


fun1()