import { removeTrailingSlash } from "./util"


class URLWithoutProtocol extends URL {
    toString() {
        // technically makes us vulnerable to ReDos attacks, 
        // but I hate trailing slashes
        return removeTrailingSlash(this.hostname + (this.port ? ':' + this.port : '') + this.pathname + (this.search ? this.search : '') + (this.hash ? this.hash + '#' : ''))
    }
}

export {
    URLWithoutProtocol
}