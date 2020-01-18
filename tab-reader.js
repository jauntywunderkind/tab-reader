#!/usr/bin/env node
import { promises as fs} from "fs"
import JSDOM_ from "jsdom"
import { get, gets} from "voodoo-opt/opt.js"
import FastMHtml from "fast-mhtml"

const JSDOM= JSDOM_.JSDOM

export async function readFile( ...opt){
	const
		ctx= await gets.call({ },{ argv: undefined, args: undefined}, ...opt),
		arg0= ctx.args[ "_"][ 0]
	if( arg0&& arg0!== "-"){
		return fs.readFile( arg0, "utf8")
	}else{
		let bufs= []
		for await( const buf of await get( "stdin", ...opt)){
			bufs.push( buf)
		}
		return buf.join( "")
	}
}

export function syncedTabs( file){
	const
		mhtml= new FastMHtml.Parser({ }),
		syncedTabs= mhtml
			.parse( file)
			.spit()
			.filter( i=> i.filename.endsWith( "syncedTabs"))
	if( syncedTabs.length!== 1){
		throw new Error( "syncedTabs file not found")
	}
	return new JSDOM( syncedTabs[ 0].content)
}

const
	Frag= JSDOM.fragment( "<div/>").constructor,
	_map= Array.prototype.map

export function descend( el, selector, opt= {}){
	function err( desc="not found"){
		return new Error( `Selection '${selector}' ${desc}`)
	}

	let selection= el.querySelectorAll( selector)
	// winnow down to things inside the template
	if( opt.shadow!== false){
		// pick the content of these elements
		selection= _map.call( selection, i=> i.content)
			.filter( i=> i.constructor.name=== "DocumentFragment")
	}
	// check count
	if( selection.length=== 0){
		if( opt.empty){
			return []
		}
		// nothing here, throw
		throw new err( "had no results")
	}else if( !opt.multi){
		if( selection.length!== 1){
			throw new err( "had too many results")
		}
		// normal path, pick this one expected item out
		selection= selection[ 0]
	}
	// return selection
	return selection
}

export async function main( opt){
	const
		file= await readFile( opt),
		dom= syncedTabs( file)
	let cursor= dom.window.document.body
	cursor= descend( cursor, "history-app template")
	cursor= descend( cursor, "history-synced-device-manager template")
	cursor= descend( cursor, "history-synced-device-card template", { multi: true})
	return dom
}
export {
	main as default,
	main as Main
}

if( typeof process!== "undefined"&& `file://${process.argv[ 1]}`=== import.meta.url){
	main()
}
