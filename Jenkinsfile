pipeline {
    agent none

    environment {
        CI = 'true'
    }

    stages {


            stage('Prepare Web Packages') {

                        agent {
                            label 'linux'
                        }

                        steps {
                            catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE'){
                                sh 'cd /home/jenkins/go/src/infini.sh/console && git stash && git pull origin master && make clean'
                                sh 'cd /home/jenkins/go/src/infini.sh/console/ && true|| rm -rif web'
                                sh 'cd /home/jenkins/go/src/infini.sh/console/ && true || git clone ssh://git@git.infini.ltd:64221/infini/console-ui.git web'
                                sh 'cd /home/jenkins/go/src/infini.sh/console/web && git pull origin master'
                                sh 'cd /home/jenkins/go/src/infini.sh/console/web && git stash'
                                sh 'cd /home/jenkins/go/src/infini.sh/console/web && cnpm install'
                                sh 'cd /home/jenkins/go/src/infini.sh/console/web && cnpm run build'
                                sh 'cd /home/jenkins/go/src/infini.sh/console &&  git pull origin master && make config build-linux'
                                sh 'cd /home/jenkins/go/src/infini.sh/console &&  git pull origin master && GOPATH="/infini/go-pkgs/go-loongarch/" make config build-loong64'
                                sh 'cd /home/jenkins/go/src/infini.sh/console &&  git pull origin master && make config build-arm'
                                sh 'cd /home/jenkins/go/src/infini.sh/console &&  git pull origin master && make config build-darwin'
                                sh 'cd /home/jenkins/go/src/infini.sh/console &&  git pull origin master && make config build-win'
				sh 'cd /home/jenkins/go/src/infini.sh/agent && git stash && git pull origin master && GOROOT="/infini/go-pkgs/go-loongarch" GOPATH="/home/jenkins/go" make build-linux-loong64'
                                sh "cd /home/jenkins/go/src/infini.sh/console/docker && chmod a+x *.sh && perl -pi -e 's/\r\n/\n/g' *.sh && \
                                                cd /home/jenkins/go/src/infini.sh/console/web/docker && chmod a+x *.sh && perl -pi -e 's/\r\n/\n/g' *.sh"

                                sh label: 'copy-license', script: 'cd /home/jenkins/go/src/infini.sh/console && cp ../framework/LICENSE bin && cat ../framework/NOTICE NOTICE > bin/NOTICE'

                                sh label: 'copy-configs', script: 'cd /home/jenkins/go/src/infini.sh/console && mkdir -p bin/config && cp config/*.json bin/config && cp config/*.tpl bin/config'

                                sh label: 'package-linux-amd64', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-amd64.tar.gz console-linux-amd64 console.yml  LICENSE NOTICE config'
                                sh label: 'package-linux-386', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-386.tar.gz console-linux-386 console.yml  LICENSE NOTICE config'
                                sh label: 'package-linux-mips', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-mips.tar.gz console-linux-mips console.yml  LICENSE NOTICE config'
                                sh label: 'package-linux-mipsle', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-mipsle.tar.gz console-linux-mipsle console.yml  LICENSE NOTICE  config'
                                sh label: 'package-linux-mips64', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-mips64.tar.gz console-linux-mips64 console.yml  LICENSE NOTICE  config'
                                sh label: 'package-linux-mips64le', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-mips64le.tar.gz console-linux-mips64le console.yml  LICENSE NOTICE  config'
                                sh label: 'package-linux-loong64', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-loong64.tar.gz console-linux-loong64 console.yml  LICENSE NOTICE  config'
                                sh label: 'package-linux-riscv64', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-riscv64.tar.gz console-linux-riscv64 console.yml  LICENSE NOTICE  config'
                                sh label: 'package-linux-arm5', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-arm5.tar.gz console-linux-armv5 console.yml  LICENSE NOTICE  config'
                                sh label: 'package-linux-arm6', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-arm6.tar.gz console-linux-armv6 console.yml  LICENSE NOTICE  config'
                                sh label: 'package-linux-arm7', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-arm7.tar.gz console-linux-armv7 console.yml  LICENSE NOTICE  config'
                                sh label: 'package-linux-arm64', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && tar cfz ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-linux-arm64.tar.gz console-linux-arm64 console.yml  LICENSE NOTICE  config'

                                sh label: 'package-mac-amd64', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && zip -r ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-mac-amd64.zip console-mac-amd64 console.yml  LICENSE NOTICE  config'
                                sh label: 'package-mac-arm64', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && zip -r ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-mac-arm64.zip console-mac-arm64 console.yml  LICENSE NOTICE  config'
                                sh label: 'package-win-amd64', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && zip -r ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-windows-amd64.zip console-windows-amd64.exe console.yml  LICENSE NOTICE  config'
                                sh label: 'package-win-386', script: 'cd /home/jenkins/go/src/infini.sh/console/bin && zip -r ${WORKSPACE}/console-$VERSION-$BUILD_NUMBER-windows-386.zip console-windows-386.exe console.yml  LICENSE NOTICE  config'
                                archiveArtifacts artifacts: 'console-$VERSION-$BUILD_NUMBER-*.*', fingerprint: true, followSymlinks: true, onlyIfSuccessful: false
                            }
                        }
            }




}

}
