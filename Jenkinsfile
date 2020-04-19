pipeline {
    agent any

    environment { 
        CI = 'true'
    }
    stages {
        
        stage('Stop Docker') { 
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE'){
                    sh 'cd /home/deploy/logging-center/web && cnpm run docker:stop-dev || true' 
                }
            }
        }


        stage('Update Docker') { 
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE'){
                    sh 'docker pull docker.infini.ltd:64443/nodejs-dev:latest' 
                }
            }
        }


        


        stage('Update Files') {
            steps {
                sh 'cd /home/deploy/logging-center && git pull origin master'
            }
        }
        stage('Install Packages') {
            steps {
                sh 'cd /home/deploy/logging-center && cnpm install'
            }
        }
        
        stage('Start Docker') { 
            steps {
                sh 'cd /home/deploy/logging-center/web && cnpm run docker:dev'  
            }
        }

    }
}
