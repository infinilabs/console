package security

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/pbkdf2"
	"infini.sh/framework/core/util"
)

const (
	PasswordChallengeMethod     = "challenge"
	PasswordChallengeAlgorithm  = "PBKDF2-SHA256"
	PasswordChallengeIterations = 120000
	passwordChallengeKeyLength  = 32
	loginChallengeTTL           = 5 * time.Minute
)

type LoginChallenge struct {
	ID       string
	Username string
	Nonce    string
	ExpireAt time.Time
}

var loginChallengeLocker sync.Mutex
var loginChallengeMap = map[string]LoginChallenge{}

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
	if password == "" {
		return "", errors.New("password is empty")
	}
	if salt == "" {
		return "", errors.New("password salt is empty")
	}
	key := pbkdf2.Key([]byte(password), []byte(salt), PasswordChallengeIterations, passwordChallengeKeyLength, sha256.New)
	return hex.EncodeToString(key), nil
}

func BuildPasswordProof(verifier, username, challengeID, nonce string) (string, error) {
	key, err := hex.DecodeString(verifier)
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(username))
	mac.Write([]byte(":"))
	mac.Write([]byte(challengeID))
	mac.Write([]byte(":"))
	mac.Write([]byte(nonce))
	return hex.EncodeToString(mac.Sum(nil)), nil
}

func VerifyPasswordProof(verifier, username, challengeID, nonce, proof string) bool {
	expected, err := BuildPasswordProof(verifier, username, challengeID, nonce)
	if err != nil {
		return false
	}
	expectedBytes, err := hex.DecodeString(expected)
	if err != nil {
		return false
	}
	proofBytes, err := hex.DecodeString(strings.ToLower(proof))
	if err != nil {
		return false
	}
	return hmac.Equal(expectedBytes, proofBytes)
}

func NewLoginChallenge(username string) LoginChallenge {
	now := time.Now()
	loginChallengeLocker.Lock()
	defer loginChallengeLocker.Unlock()

	for id, challenge := range loginChallengeMap {
		if challenge.ExpireAt.Before(now) {
			delete(loginChallengeMap, id)
		}
	}

	challenge := LoginChallenge{
		ID:       util.GenerateSecureString(32),
		Username: username,
		Nonce:    util.GenerateSecureString(32),
		ExpireAt: now.Add(loginChallengeTTL),
	}
	loginChallengeMap[challenge.ID] = challenge
	return challenge
}

func ConsumeLoginChallenge(challengeID, username string) (LoginChallenge, error) {
	loginChallengeLocker.Lock()
	defer loginChallengeLocker.Unlock()

	challenge, ok := loginChallengeMap[challengeID]
	if !ok {
		return LoginChallenge{}, errors.New("login challenge is invalid")
	}
	delete(loginChallengeMap, challengeID)

	if challenge.ExpireAt.Before(time.Now()) {
		return LoginChallenge{}, errors.New("login challenge expired")
	}
	if challenge.Username != username {
		return LoginChallenge{}, errors.New("login challenge does not match user")
	}
	return challenge, nil
}
