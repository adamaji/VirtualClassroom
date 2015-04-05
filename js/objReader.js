var reader = new FileReader();

function getOBJString() {
	var file = document.getElementById( 'scriptInput' ).files[0];
	reader.readAsDataURL( file );	
}