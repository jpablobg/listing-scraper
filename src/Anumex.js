import Base from './Base'
import cheerio from 'cheerio'
import Debug from 'debug'
import _ from 'lodash'
import { clean, join } from 'underscore.string'
const db = require('db')()
const Listing = db.base.models.Listing
const anumexUrl = 'http://wwww.anumex.com'
const debug = Debug('scraper-anumex')


export default class Anumex extends Base{
  *getCategories(){
    let html= yield this.getHtml(anumexUrl)
    let $ = cheerio.load(html)
    let categories = $('#sm_cat>div>a:first-child').toArray()
    categories = _.map(categories,(cat)=>{
      cat = $(cat)
      return cat.attr('href')
    })
    debug(categories)
    return categories
  }
  *getListOfPagesForCategory(url, limit){
    let html= yield this.getHtml(url)
    let $ = cheerio.load(html)
    let numAnuncios = $('.res_nav').next().html()
    numAnuncios = parseInt(numAnuncios.match(/([0-9\,]+)\</)[0].replace(',',''))
    debug(numAnuncios)
    numAnuncios = numAnuncios/30
    let urls = []
    for (var i = 1; i < numAnuncios; i++) {
      urls.push(`${url}?p=${i}`)
      numAnuncios = numAnuncios-1
    }
    if(limit)
    urls = _.take(urls, limit)
    debug(urls)
    return urls
  }
  *getAdsFromPage(url){
    let html= yield this.getHtml(url)
    let $ = cheerio.load(html)
    let pages = $('.res>.ad>a').toArray()
    pages = _.map(pages,(cat)=>{
      cat = $(cat)
      return cat.attr('href')
    })
    debug(pages)
    return pages
  }
  *getDataFromPage(url){
    let html= yield this.getHtml(url)
    let $ = cheerio.load(html)
    let data = {}
    data.meta = {}
    data.meta.url = url
    data.img = $('.thumbs>.thumb>a>img').toArray()
    data.img = _.map(data.img,(img)=>{
      img = $(img)
      img = img.attr('src').replace('thumbs','pictures')
      img = `${anumexUrl}${img}`
      return img
    })
    data.tags = $('.adoptions').html().replace(/(\<\/*b\>|\&#xA0;)/g,'').split(/\s\s/)

    data.tags = _.map(data.tags,(tag)=>{
      tag = tag.split(':')
      tag = _.last(tag)
      return tag

    })
    data.title = join(' ', data.tags)
    data.categories = $('.m10>a').toArray()
    data.categories = _.map(data.categories,(cat)=>{
      return $(cat).html()
    })
    data.meta.location  = $('.adlocation').text().split(':')[1]
    data.meta.location  = clean(data.meta.location)
    data.price = $('.adprice').text().replace(/([\$\,a-z\s]*)/g,'')
    data.price = parseInt(data.price)
    data.body = $('.adtext').text()
    let phoneurl = `${anumexUrl}/showPhone.jsp?id=${url.match(/([0-9]+)$/)[1]}`
    data.meta.phone = yield this.getHtml(phoneurl)
    data.meta.phone = cheerio.load(data.meta.phone)('a').attr('href').match(/[0-9]+$/)[0]
    debug(phoneurl)
    debug(data)
    return data
  }
  *saveData(data){
    let listing = new Listing(data)
    yield listing.save()
    debug(listing)
    return listing
  }
  *getDataAndSave(url){
      let data = yield this.getDataFromPage(url)
      return yield this.saveData(data)
  }
}
