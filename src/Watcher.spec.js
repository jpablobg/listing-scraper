require('babel/register')({
  sourceMap: 'inline'
})
import { expect } from 'chai'
import Module from './Watcher.js'
import _ from 'lodash'
import Debug from 'debug'
import ms from 'ms'
import validator from 'validator'

let debug = Debug('test')
let module = new Module()
describe('#getAllSites',function(){
  this.timeout(ms('3s'))
  it('should return a random proxy', function*(){
    let sites = yield module.getAllSites()
    expect(sites[0]).to.match(/http:\/\//)
  })
})
describe('#getListings',function(){
  this.timeout(ms('5s'))
  it('get listings from site', function*(){
    let sites = yield module.getAllSites()
    let listings = yield module.getListings('http://sfbay.craigslist.org', '/cpg', 'javascript')
    if(listings.length==0)return;
    expect(listings[0]).to.match(/[0-9]{10}.html$/)
  })
  it('get listings within date interval', function*(){
    let module = new Module({interval: ms('24h')})
    let sites = yield module.getAllSites()
    let listings = yield module.getListings('http://sfbay.craigslist.org', '/cpg', 'javascript')
    debug(listings)
    if(listings.length==0)return;
    expect(listings[0]).to.match(/[0-9]{10}.html$/)
  })
})
describe('#getEmail',function(){
  this.timeout(ms('6s'))
  it('should return email for listing', function*(){
    let sites = yield module.getAllSites()
    let listings = yield module.getListings('http://sfbay.craigslist.org', '/cpg', 'javascript ios')
    let listingUrl = listings[0]
    let { replylink } = yield module.getListingData(listingUrl)
    let email = yield module.getEmail(replylink, listingUrl)
    expect(validator.isEmail(email)).to.be.true
  })
})
describe('#getPostIdFromUrl',function(){
  let url = 'http://sfbay.craigslist.org/pen/cpg/5060716049.html'
  this.timeout(ms('4s'))
  it('should return valid post id.', ()=>{
    let postId = module.getPostIdFromUrl(url)
    expect(postId).to.be.length(10)
  })
  it('should throw when unable to parse post id.', ()=>{
    let url = 'http://sfbay.craigslist.org/pen/cpg/16049.html'
    expect(()=>{module.getPostIdFromUrl(url)}).to.throw
  })
})
describe('#getListingData',function(){
  this.timeout(ms('3s'))
  it('get all listing data', function*(){
    let listings = yield module.getListings('http://sfbay.craigslist.org', '/cpg', 'javascript ios')
    let listingUrl = listings[0]
    let data = yield module.getListingData(listingUrl)
    expect(data).to.have.keys([
      'body'
      , 'title'
      , 'email'
      , 'url'
      ])
  })
})

describe('#emailListing',function(){
  this.timeout(ms('30s'))
  it('email listing', function*(){
    let listings = yield module.getListings('http://sfbay.craigslist.org', '/cpg', 'javascript ios')
    return;
    let listingUrl = listings[0]
    let data = yield module.getListingData(listingUrl)
    debug(data)
    let opts={
      user: 'chinnno15@gmail.com'
      , pass: 'Chuy081805'
      , data: data
    }
    yield module.emailListing(opts)
  })
})
