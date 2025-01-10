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

func GenerateClientCert(caFile, caKey string) (caCert, clientCertPEM, clientKeyPEM []byte, err error) {
	return generateCert(caFile, caKey, false)
}

func GenerateServerCert(caFile, caKey string) (caCert, serverCertPEM, serverKeyPEM []byte, err error) {
	return generateCert(caFile, caKey, true)
}

func generateCert(caFile, caKey string, isServer bool) (caCert, instanceCertPEM, instanceKeyPEM []byte, err error) {
	pool := x509.NewCertPool()
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
	if isServer {
		b = &pem.Block{Type: "CERTIFICATE", Bytes: caCertBytes}
		certPEM := pem.EncodeToMemory(b)
		instanceCertPEM, instanceKeyPEM, err = util.GenerateServerCert(rootCert, certKey.(*rsa.PrivateKey), certPEM, nil)
	} else {
		_, instanceCertPEM, instanceKeyPEM = util.GetClientCert(rootCert, certKey)
	}
	return caCert, instanceCertPEM, instanceKeyPEM, nil
}

func GetAgentInstanceCerts(caFile, caKey string) (string, string, error) {
	dataDir := global.Env().GetDataDir()
	instanceCrt := path.Join(dataDir, "certs/agent/instance.crt")
	instanceKey := path.Join(dataDir, "certs/agent/instance.key")
	var (
		err           error
		clientCertPEM []byte
		clientKeyPEM  []byte
	)
	if util.FileExists(instanceCrt) && util.FileExists(instanceKey) {
		return instanceCrt, instanceKey, nil
	}
	_, clientCertPEM, clientKeyPEM, err = GenerateClientCert(caFile, caKey)
	if err != nil {
		return "", "", err
	}
	baseDir := path.Join(dataDir, "certs/agent")
	if !util.IsExist(baseDir) {
		err = os.MkdirAll(baseDir, 0775)
		if err != nil {
			return "", "", err
		}
	}
	_, err = util.FilePutContentWithByte(instanceCrt, clientCertPEM)
	if err != nil {
		return "", "", err
	}
	_, err = util.FilePutContentWithByte(instanceKey, clientKeyPEM)
	if err != nil {
		return "", "", err
	}
	return instanceCrt, instanceKey, nil
}
