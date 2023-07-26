class URLWithoutProtocol extends URL {
    toString() {
        return this.hostname + (this.port ? ':' + this.port : '') + this.pathname + (this.search ? this.search : '') + (this.hash ? this.hash + '#' : '')
    }
}

export {
    URLWithoutProtocol
}