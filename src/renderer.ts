// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.


function fun1() {
    console.log("test")
    document.write(" chrome :" + process.versions.chrome)
    document.write(" electron :" + process.versions.electron)
    document.write(" hot hot hot ....")
}


fun1()