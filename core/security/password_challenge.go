package security

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
	passwordchallenge "infini.sh/framework/core/security/passwordchallenge"
	"infini.sh/framework/core/util"
)

const (
	PasswordChallengeMethod     = passwordchallenge.Method
	PasswordChallengeAlgorithm  = passwordchallenge.Algorithm
	PasswordChallengeIterations = passwordchallenge.Iterations
)

type LoginChallenge = passwordchallenge.Challenge

func CanUsePasswordChallenge(user *User) bool {
	return user != nil && user.PasswordSalt != "" && user.PasswordVerifier != ""
}

func SetPassword(user *User, password string) error {
	if user == nil {
		return errors.New("user is nil")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	salt := util.GenerateSecureString(32)
	verifier, err := DerivePasswordVerifier(password, salt)
	if err != nil {
		return err
	}
	user.Password = string(hash)
	user.PasswordSalt = salt
	user.PasswordVerifier = verifier
	return nil
}

func EnsurePasswordChallenge(user *User, password string) error {
	if user == nil {
		return errors.New("user is nil")
	}
	if CanUsePasswordChallenge(user) {
		return nil
	}
	salt := util.GenerateSecureString(32)
	verifier, err := DerivePasswordVerifier(password, salt)
	if err != nil {
		return err
	}
	user.PasswordSalt = salt
	user.PasswordVerifier = verifier
	return nil
}

func DerivePasswordVerifier(password, salt string) (string, error) {
	return passwordchallenge.DeriveVerifier(password, salt)
}

func BuildPasswordProof(verifier, username, challengeID, nonce string) (string, error) {
	return passwordchallenge.BuildProof(verifier, username, challengeID, nonce)
}

func VerifyPasswordProof(verifier, username, challengeID, nonce, proof string) bool {
	return passwordchallenge.VerifyProof(verifier, username, challengeID, nonce, proof)
}

func NewLoginChallenge(username string) LoginChallenge {
	return passwordchallenge.New(username)
}

func ConsumeLoginChallenge(challengeID, username string) (LoginChallenge, error) {
	return passwordchallenge.Consume(challengeID, username)
}
