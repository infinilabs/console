pipeline {
    agent any

    environment { 
        CI = 'true'
    }
    stages {
        
        stage('Stop Front Docker') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE'){
                    sh 'cd /home/deploy/search-center/web && cnpm run docker:stop-dev || true'
                }
            }
        }

        stage('Stop Backend Docker') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE'){
                    sh 'cd /home/deploy/search-center/docker && docker-compose -f docker-compose.dev.yml  down || true'
                }
            }
        }

        stage('Update Front Docker') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE'){
                    sh 'docker pull docker.infini.ltd:64443/nodejs-dev:latest' 
                }
            }
        }

        stage('Update Backend Docker') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE'){
                    sh 'docker pull docker.infini.ltd:64443/golang-dev:latest'
                }
            }
        }

        stage('Update Files') {
            steps {
                sh 'cd /home/deploy/search-center && git add . && git stash && git pull origin master'
            }
        }

        stage('Install Packages') {
            steps {
                sh 'cd /home/deploy/search-center && cnpm install'
            }
        }
        
        stage('Fix FileAttr') { 
            steps {
                sh "cd /home/deploy/search-center/docker && chmod a+x *.sh && perl -pi -e 's/\r\n/\n/g' *.sh && \
                cd /home/deploy/search-center/web/docker && chmod a+x *.sh && perl -pi -e 's/\r\n/\n/g' *.sh"
            }
        }

        stage('Start Front Docker') {
            steps {
                sh 'cd /home/deploy/search-center/web && cnpm run docker:dev'
            }
        }

        stage('Build Front Files') {
            steps {
                sh 'cd /home/deploy/search-center/web && cnpm run docker:build'
            }
        }

        stage('Start Backend Docker') {
            steps {
                sh 'cd /home/deploy/search-center/docker && docker-compose -f docker-compose.dev.yml  up -d'
            }
        }

    }
}
