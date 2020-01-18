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

export async function main( opt){
	const
		file= await readFile( opt),
		mhtml= new FastMHtml.Parser({ }),
		syncedTabs= mhtml
			.parse( file)
			.spit()
			.filter( i=> i.filename.endsWith( "syncedTabs"))
	if( syncedTabs.length!== 1){
		throw new Error( "syncedTabs file not found")
	}
	const
		text= syncedTabs[ 0].content,
		dom= new JSDOM( text),
		app= dom.window.document.body.querySelector("history-app")
	if( !app){
		throw new Error( "History not found")
	}
	if( app.children.length!== 1|| app.children[ 0].tagName!== "TEMPLATE"){
		throw new Error( "Template not found")
	}
	return dom
}
export {
	main as default,
	main as Main
}

if( typeof process!== "undefined"&& `file://${process.argv[ 1]}`=== import.meta.url){
	main()
}
