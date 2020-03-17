pipeline {
    agent any

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
