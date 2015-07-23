import request from 'superagent'
import proxy from 'superagent-proxy'
import Debug from 'debug'
import cheerio from 'cheerio'
import _ from 'lodash'
import qs from 'qs'
import sender from 'gmail-sender'
import _redis from 'redis'
import wrapper from 'co-redis'
import ms from 'ms'
import Proxies from 'free-proxies'
const redis = wrapper(_redis.createClient())
const keyPrefix = 'w'
const proxies = new Proxies()
let debug = Debug('watcher')
proxy(request)
const sitesUrl = 'http://www.craigslist.org/about/sites'
export default class Watcher {
  constructor(options){
    options = options || {}
    options.interval = options.interval || undefined
    this.options = options

  }
  *getHtmlFromUrl(url, query){
    if(query){
      query = qs.stringify(query)
      url = `${url}?${query}`
    }
    // let proxy = yield proxies.getRandomProxy()
    // if(!proxy)throw new Error('failed to get proxy.')
    // debug(url)
    // debug(proxy)
    return new Promise((resolve, reject)=>{
      request
      .get(url)
      .query(query)
      // .proxy(proxy)
      .end((err, res)=>{
        if(err)return reject(err)
        if(res.status!=200) {
          err = new Error('request failed')
          err.status = res.status
          return reject(err)
        }
        resolve(res.text)
      })
    })
    // .catch(err=>{
    //   if(err.status == 409){
    //     return co(function*(){
    //       yield proxies.removeProxy(proxy)
    //       throw err
    //     })
    //   }
    //   throw err
    // })
  }
  *getAllSites(){
    let html = yield this.getHtmlFromUrl(sitesUrl)
    let $ = cheerio.load(html)
    let sites = []
    $('a').each((i, a)=>{
      a = $(a)
      sites.push(a.attr('href'))
    })
    sites = _.filter(sites, url=>{
      if(!url)return false
      return url.match(/http:\/\/[^\/]+$/)
    })
    return sites
  }
  *getListings(site, url, query){
    let { interval } = this.options
    url = `${site}/search${url}`
    query = {
      query: query
    }
    let html = yield this.getHtmlFromUrl(url, query)
    let $ = cheerio.load(html)
    let listings = _.map($('.pl').toArray(), a=>{
      a = $(a)
      let postDate = a.find('time').first().attr('datetime')
      postDate = new Date(postDate)
      if(interval){
        let d = new Date()
        d = d.getTime() - interval
        d = new Date(d)
        if(postDate<d)return;
      }
      a = `${a.find('a').attr('href')}`
      return a
    })
    listings = _.filter(listings, l=>{
      return l!=undefined
    })
    return listings
  }
  *getEmail(url, listingUrl){
    if(!url || !listingUrl) throw new Error('missing args.')
    let html = yield this.getEmailLinksHtml(url, listingUrl)
    let $ = cheerio.load(html)
    return $('.anonemail').first().html()
  }
  *getEmailLinksHtml(url, referer){
    // let proxy = yield proxies.getRandomProxy()
    return new Promise((resolve, reject)=>{
      request
      .get(url)
      .set('Host', 'sfbay.craigslist.org')
      .set('Accept', '*/*')
      .set('Accept-Encoding', 'gzip, deflate, sdch')
      .set('Accept-Language', 'en-US,en;q=0.8,es;q=0.6')
      .set('Referer', referer)
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36')
      .set('Cookie', 'cl_b=Hg3BXSIW5RGMLTmnZZLk9ANbjQ4; cl_def_lang=en; cl_def_hp=sfbay; cl_tocmode=sss%3Agrid%2Cggg%3Alist%2Crrr%3Alist')
      // .proxy(proxy)
      .end((err, res)=>{
        if(err)return reject(err)
        if(res.status!=200) return reject(new Error('request failed'))
        resolve(res.text)
      })
    })
  }
  getPostIdFromUrl(url){
    url = url.match(/([0-9]{10,}).html$/)
    if(!url)throw new Error('failed to parse post id from url.')
    return url[1]
  }
  getSiteFromUrl(url){
    url = url.match(/http:\/\/[^\/]+/)
    if(!url)throw new Error('unable to parse site from url')
    return url[0]
  }
  *getListingData(url){
    let html = yield this.getHtmlFromUrl(url)
    let $ = cheerio.load(html)
    let replylink = `${this.getSiteFromUrl(url)}${$('#replylink').first().attr('href')}`
    let data = {}
    data.body = $('#postingbody').html()
    data.title = $('.postingtitletext').html()
    data.url = url
    data.email = yield this.getEmail(replylink, url)
    debug(data)
    return data
  }
  *emailListing(options){
    let key =`${keyPrefix}:${options.data.email}`
    if(!options.data.email)throw new Error('missing email')
    let email = yield redis.get(key)
    if(email)return;
    let _smtp = _.pick(options, ['user', 'pass'])
    _smtp.service = 'Gmail'
    sender.options({
      smtp: _smtp
    })
    let mail = {
      subject: options.data.title
      , template: './assets/templates/posting.html'
      , from: options.data.email
      , to: {
        email: 'jose.oliveros.1983@gmail.com'
      }
      , data: options.data
    }
    sender.send(mail)
    yield redis.psetex(key, ms('24h'), options.data.title)
  }
}