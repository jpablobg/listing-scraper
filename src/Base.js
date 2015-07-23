import phantom from 'co-phantom'
import cheerio from 'cheerio'
import Debug from 'debug'
import _ from 'lodash'
const url = 'http://wwww.anumex.com'
const debug = Debug('scraper-anumex')
export default class Base{
  *init(){
    if(!this.phantom)
    this.phantom = yield phantom.create()
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
  *getCategories(){
    let html= yield this.getHtml(url)
    let $ = cheerio.load(html)
    let categories = $('#sm_cat>div>a:first-child').toArray()
    categories = _.map(categories,(cat)=>{
      cat = $(cat)
      return cat.attr('href')
    })
    debug(categories)
    return categories
  }
  *getListOfPagesForCategory(url){
    let html= yield this.getHtml(url)
    let $ = cheerio.load(html)
    let numAnuncios = $('.res_nav').next().html()
    numAnuncios = parseInt(numAnuncios.match(/([0-9\,]+)\</)[0].replace(',',''))
    debug(numAnuncios)
    numAnuncios = numAnuncios/30
    let urls = []
    for (var i = 0; i < numAnuncios; i++) {
      urls.push(`${url}?p=${i}`)
      numAnuncios = numAnuncios-1
    }
    debug(urls)
  }
}
