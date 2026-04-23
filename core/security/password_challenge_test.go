package security

import "testing"

func TestPasswordChallengeProofRoundTrip(t *testing.T) {
	verifier, err := DerivePasswordVerifier("admin", "salt-123")
	if err != nil {
		t.Fatalf("derive verifier: %v", err)
	}

	challenge := NewLoginChallenge("admin")
	proof, err := BuildPasswordProof(verifier, "admin", challenge.ID, challenge.Nonce)
	if err != nil {
		t.Fatalf("build proof: %v", err)
	}

	if !VerifyPasswordProof(verifier, "admin", challenge.ID, challenge.Nonce, proof) {
		t.Fatal("expected password proof to validate")
	}
}

func TestSetPasswordEnablesChallengeLogin(t *testing.T) {
	user := &User{}
	if err := SetPassword(user, "admin"); err != nil {
		t.Fatalf("set password: %v", err)
	}

	if user.Password == "" || user.PasswordSalt == "" || user.PasswordVerifier == "" {
		t.Fatal("expected password, salt and verifier to be populated")
	}
	if !CanUsePasswordChallenge(user) {
		t.Fatal("expected challenge login to be enabled")
	}
}
