import phantom from 'co-phantom'
import cheerio from 'cheerio'
import Debug from 'debug'
import _ from 'lodash'
import Proxies from 'free-proxies'
import { clean } from 'underscore.string'
const anumexUrl = 'http://wwww.anumex.com'
const debug = Debug('scraper-anumex')
const proxies = new Proxies()
export default class Base{
  *init(){
    if(this.phantom)return;
    let proxy = yield proxies.getRandomProxy()
    proxy = proxy.match(/[0-9\.\:]+$/)[0]
    debug(proxy)
    this.phantom = yield phantom.create({
      parameters:{
        proxy:proxy
      }
    })
  }
  *getHtml(url){
    yield this.init()
    let page = yield this.phantom.createPage()
    let wait = page.wait('loadFinished')
    yield page.open(url)
    yield wait;
    let html =yield page.evaluate(()=>{
      return document.body.innerHTML
    })
    return html
  }

}
