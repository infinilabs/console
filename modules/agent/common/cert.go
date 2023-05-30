/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"os"
	"path"
)

func GenerateClientCert(caFile, caKey string) (caCert, clientCertPEM, clientKeyPEM []byte, err error){
	return generateCert(caFile, caKey, false)
}

func GenerateServerCert(caFile, caKey string) (caCert, serverCertPEM, serverKeyPEM []byte, err error){
	return generateCert(caFile, caKey, true)
}

func generateCert(caFile, caKey string, isServer bool)(caCert, instanceCertPEM, instanceKeyPEM []byte, err error){
	pool := x509.NewCertPool()
	if caFile == "" {
		caFile = path.Join(global.Env().GetConfigDir(), "certs", "ca.crt")
	}
	caCert, err = os.ReadFile(caFile)
	if err != nil {
		return
	}
	pool.AppendCertsFromPEM(caCert)
	b, _ := pem.Decode(caCert)
	var rootCert *x509.Certificate
	caCertBytes := b.Bytes
	rootCert, err = x509.ParseCertificate(b.Bytes)
	if err != nil {
		return
	}
	if caKey == "" {
		caKey = path.Join(global.Env().GetConfigDir(), "certs", "ca.key")
	}
	var keyBytes []byte
	keyBytes, err = os.ReadFile(caKey)
	if err != nil {
		return
	}
	b, _ = pem.Decode(keyBytes)
	certKey, err := util.ParsePrivateKey(b.Bytes)
	if err != nil {
		return
	}
	if isServer{
		b = &pem.Block{Type: "CERTIFICATE", Bytes: caCertBytes}
		certPEM := pem.EncodeToMemory(b)
		instanceCertPEM, instanceKeyPEM, err  = util.GenerateServerCert(rootCert, certKey.(*rsa.PrivateKey), certPEM, nil)
	}else{
		_, instanceCertPEM, instanceKeyPEM = util.GetClientCert(rootCert, certKey)
	}
	return caCert, instanceCertPEM, instanceKeyPEM, nil
}
