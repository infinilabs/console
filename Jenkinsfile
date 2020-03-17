pipeline {
    agent any

    environment { 
        CI = 'true'
    }
    stages {
        
        stage('Stop Docker') { 
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE'){
                    sh 'cd /home/deploy/logging-center && cnpm run docker:stop' 
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
                sh 'cd /home/deploy/logging-center && cnpm run docker:dev'  
            }
        }

    }
}
