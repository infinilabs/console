pipeline {
    agent any

    environment { 
        CI = 'true'
    }
    stages {
        stage('Update') {
            steps {
                sh 'cd /home/deploy/logging-center && git pull origin master'
            }
        }
        stage('Install') {
            steps {
                sh 'cd /home/deploy/logging-center && cnpm install'
            }
        }
        stage('Docker') { 
            steps {
                sh 'cd /home/deploy/logging-center && cnpm run docker:stop' 
            }
        }

        stage('Start Docker') { 
            steps {
                sh 'cd /home/deploy/logging-center && cnpm run docker:dev'  
            }
        }

    }
}
