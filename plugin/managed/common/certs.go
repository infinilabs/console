/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"crypto/x509"
	"encoding/pem"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"os"
	"path"
)

func GetOrInitDefaultCaCerts()(string, string, error){
	dataDir := global.Env().GetDataDir()
	caFile := path.Join(dataDir, "certs/ca.crt")
	caKey := path.Join(dataDir, "certs/ca.key")
	if !(util.FileExists(caFile) && util.FileExists(caKey) ) {
		err := os.MkdirAll(path.Join(dataDir, "certs"), 0775)
		if err != nil {
			return "", "", err
		}
		log.Info("auto generating cert files")
		_, rootKey, rootCertPEM := util.GetRootCert()

		caKeyPEM := pem.EncodeToMemory(&pem.Block{
			Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(rootKey),
		})
		_, err = util.FilePutContentWithByte(caKey, caKeyPEM)
		if err != nil {
			return "", "", err
		}
		_, err = util.FilePutContentWithByte(caFile, rootCertPEM)
		if err != nil {
			return "", "", err
		}
	}
	return caFile, caKey, nil
}

