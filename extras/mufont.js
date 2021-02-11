#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const process = require('process');

if ( process.argv.length < 3 ) {
	console.error( "USAGE: mufont [-j] <fontfile>" );
	return 1;
}

let jsonmode = process.argv[2] == '-j';
let pathname = jsonmode ? typeof process.argv[3] === 'string' ? process.argv[3] : "" : process.argv[2];
let filename = path.basename( pathname ).replace(/\.[^\.]*$/, '').replace(/ /g, '_');

try {
	var content = fs.readFileSync( pathname, { encoding: 'utf8', flags: 'r'} ).split('\n');
	if (!content.length) {
		console.error( "ERROR: font source file " + pathname + " has no content" );
		return 1;
	}
}
catch ( error ) {
	console.error( "ERROR: " + error.message );
	return error.errno;
}

function calculateBytes( glyph ) {
	// determine number of bits per row
	glyph.width = 0;
	glyph.height = glyph.graph.length;
	glyph.graph.forEach( row => {
		if ( row.length > glyph.width ) {
			glyph.width = row.length;
		}
	} );
	// pad rows to same length
	for ( let i = 0; i < glyph.graph.length; i++ ) {
		glyph.graph[i] = glyph.graph[i].padEnd( glyph.width );
	}
	glyph.bits = glyph.graph.join( '' ).replace(/ /g, '0').replace(/[^0]/g, '1');
	// create full bytes
	while ( glyph.bits.length > 8 ) {
		glyph.bytes.push( parseInt( glyph.bits.slice( 0, 8 ), 2 ) );
		glyph.bits = glyph.bits.slice( 8 );
	}
	if ( glyph.bits.length ) {
		// zerofill
		glyph.bits = glyph.bits.padEnd( 8, '0' );
		glyph.bytes.push( parseInt( glyph.bits.slice( 0, 8 ), 2 ) );
	}
	delete glyph.bits;
}

function getCharCode( part ) {
	if ( part.length === 1 ) {
		return part.charCodeAt( 0 );
	}
	else if ( part.slice( 0, 2 ) == '0x' ) {
		return parseInt( part.slice( 2 ), 16 );
	}
	else {
		return -1;
	}
}

let glyphs = [];
let glyph = undefined;
while ( content.length ) {
	let line = content.shift();
	if ( line.charAt(0) == ':' ) {
		// flush previous glyph if any
		if ( glyph ) {
			calculateBytes( glyph );
			glyphs.push( glyph );
		}
		// prepare new glyph
		let parts = line.split( ',' );
		glyph = {
			charCode: getCharCode( parts[ 0 ].slice( 1 ) ),
			xAdvance: parts[ 1 ],
			xOffset: parts[ 2 ],
			yOffset: parts[ 3 ],
			graph: [],
			bytes: []
		};
	}
	else {
		glyph.graph.push(line.trimEnd());
	}
}
// flush last glyph
if ( glyph ) {
	calculateBytes( glyph );
	glyphs.push( glyph );
}

if ( jsonmode ) {
	glyphs.forEach( glyph => {
		glyph.bits = glyph.graph.join( '' ).replace(/ /g, '0').replace(/[^0]/g, '1');
		glyph.graph = glyph.graph.map( s => s.replace(/[^ ]/g, '⬤') );
	} );
	// output structure
	console.error(JSON.stringify(glyphs, null, 4));
	return 0;
}

// ⬤⬤⬤⬤
// ⬤⬤⬤⬤
// ⬤⬤⬤⬤
// ⬤⬤⬤⬤

// U+2B24

// output
process.stdout.write( `// ${filename}.h - created with mufont, the muwerk font compiler

const uint8_t ${filename}_bitmaps[] PROGMEM = {`);

let bytes = 0;
let bitmapsize = 0;
let first = glyphs[0].charCode;
let last = first;
glyphs.forEach( glyph => {
	bitmapsize += glyph.bytes.length;
	last = glyph.charCode;
} );

// output bitmap
glyphs.forEach( glyph => {
	glyph.bitmapOffset = bytes;
	glyph.bytes.forEach( byte => {
		if ( bytes % 16 === 0 ) {
			process.stdout.write( `\n\t0x${byte.toString( 16 ).padStart( 2, '0' )}` );
		}
		else {
			process.stdout.write( ` 0x${byte.toString( 16 ).padStart( 2, '0' )}` );
		}
		bytes++;
		if ( bytes < bitmapsize ) {
			process.stdout.write( ',' );
		}
	} );
} );
process.stdout.write( '};\n\n' );


// output glyphs
process.stdout.write( `const GFXglyph ${filename}_glyphs[] PROGMEM = {\n`);
glyphs.forEach( glyph => {
	process.stdout.write( `\t{0x${glyph.bitmapOffset.toString( 16 ).padStart( 4, '0' )}, ${glyph.width}, ${glyph.height}, ${glyph.xAdvance}, ${glyph.xOffset}, ${glyph.yOffset}},\t // 0x${glyph.charCode.toString( 16 )} '${String.fromCharCode(glyph.charCode)}'\n` );
} );
process.stdout.write( '};\n\n' );

// output font
process.stdout.write( `const GFXfont ${filename} PROGMEM = {
	(uint8_t *) ${filename}_bitmaps,
	(GFXglyph *) ${filename}_glyphs,
	0x${first.toString( 16 )},
	0x${last.toString( 16 )},
	8
};

// Approx. ${bitmapsize + 8 * glyphs.length + 8} bytes
`);



