// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

package main

import (
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"github.com/crewjam/saml"
	"net/http"
	"net/url"

	"github.com/crewjam/saml/samlsp"
)

var metdataurl = "https://sso.infini.ltd/metadata" //Metadata of the IDP
var sessioncert = "./sessioncert"                  //Key pair used for creating a signed session
var sessionkey = "./sessionkey"
var serverkey = "./serverkey" //Server TLS
var servercert = "./servercert"
var serverurl = "https://localhost" // base url of this service
var entityId = serverurl            //Entity ID uniquely identifies your service for IDP (does not have to be server url)
var listenAddr = "0.0.0.0:443"

func hello(w http.ResponseWriter, r *http.Request) {
	s := samlsp.SessionFromContext(r.Context())
	if s == nil {
		return
	}
	sa, ok := s.(samlsp.SessionWithAttributes)
	if !ok {
		return
	}

	fmt.Fprintf(w, "Token contents, %+v!", sa.GetAttributes())
}

func main() {
	keyPair, err := tls.LoadX509KeyPair(sessioncert, sessionkey)
	panicIfError(err)
	keyPair.Leaf, err = x509.ParseCertificate(keyPair.Certificate[0])
	panicIfError(err)
	//idpMetadataURL, err := url.Parse(metdataurl)

	panicIfError(err)
	rootURL, err := url.Parse(serverurl)
	panicIfError(err)
	samlSP, _ := samlsp.New(samlsp.Options{
		URL:         *rootURL,
		Key:         keyPair.PrivateKey.(*rsa.PrivateKey),
		Certificate: keyPair.Leaf,
		IDPMetadata: &saml.EntityDescriptor{
				//EntityID:
		},        // you can also have Metadata XML instead of URL
		EntityID: entityId,
	})
	app := http.HandlerFunc(hello)
	http.Handle("/hello", samlSP.RequireAccount(app))
	http.Handle("/saml/", samlSP)
	panicIfError(http.ListenAndServeTLS(listenAddr, servercert, serverkey, nil))
}
func panicIfError(err error) {
	if err != nil {
		panic(err)
	}
}
