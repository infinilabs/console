pipeline {
    agent any

    triggers {
        cron('H 4/* 0 0 1-5')
    }

    environment { 
        CI = 'true'
    }
    stages {
        stage('Build') {
            steps {
                sh 'cnpm install'
            }
        }
        stage('Test') {
            steps {
                sh '/bin/true'
            }
        }
        stage('Deliver') { 
            steps {
                sh '/bin/true' 
            }
        }
    }
}
