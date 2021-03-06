from test.helpers.PDUnitTest import PDUnitTest
from pdoauth.models import Credential
from test.helpers.EmailUtil import EmailUtil
import time
from uuid import uuid4
from pdoauth.models.User import User
from pdoauth.ReportedError import ReportedError
from pdoauth.Messages import badChangeEmailSecret,\
    thereIsAlreadyAUserWithThatEmail, emailChangeIsCancelled, emailChanged
from pdoauth.models.Assurance import Assurance
import json

class EmailChangeTest(PDUnitTest, EmailUtil):

    def setUp(self):
        self.anyuser = User.query.first()  # @UndefinedVariable
        self.user = self.createUserWithCredentials().user
        Assurance.new(self.user, 'emailverification', self.user)
        self.oldEmailAddress = self.userCreationEmail
        self.newEmailAddress = "email{0}@example.com".format(self.mkRandomString(5))
        PDUnitTest.setUp(self)

    
    def test_emailChangeInit_throws_error_if_new_email_equals_the_old(self):
        with self.assertRaises(ReportedError) as context:
            self.controller.emailChangeInit(self.userCreationEmail, self.user)
        self.assertEqual(context.exception.descriptor,thereIsAlreadyAUserWithThatEmail)
        self.assertEqual(context.exception.status,418)

    
    def test_emailChangeInit_throws_error_if_new_email_equals_an_existing_one(self):
        with self.assertRaises(ReportedError) as context:
            self.controller.emailChangeInit(self.anyuser.email, self.user)
        self.assertEqual(context.exception.descriptor,thereIsAlreadyAUserWithThatEmail)
        self.assertEqual(context.exception.status,418)
        
    
    def test_emailChangeInit_creates_a_temporary_changeemail_credential(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        self.assertNotEqual(None, Credential.getByUser(self.user, "changeemail"))

    
    def test_emailChangeinit_creates_a_temporary_changeemailandverify_credential(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        self.assertNotEqual(None, Credential.getByUser(self.user, "changeemailandverify"))

    
    def test_changeemail_credential_contains_new_emailaddress(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        self.assertEqual(self.newEmailAddress, Credential.getByUser(self.user, "changeemail").getAdditionalInfo())
        

    
    def test_emailChangeInit_sends_email_to_old_address(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        self.assertEqual(self.oldEmailAddress,self.controller.mail.outbox[0].recipients[0])

    
    def test_emailChangeInit_email_to_old_address_contains_changeemail_credential_secret(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        cred = Credential.getByUser(self.user, "changeemail")
        message = self.controller.mail.outbox[0]
        self.assertIn(cred.secret, message.body)

    
    def test_emailChangeInit_email_to_new_address_contains_changeemailandverify_credential_secret(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        cred = Credential.getByUser(self.user, "changeemailandverify")
        message = self.controller.mail.outbox[1]
        self.assertIn(cred.secret, message.body)

    
    def test_emailChangeInit_sends_email_to_new_address(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        self.assertEqual(self.newEmailAddress,self.controller.mail.outbox[1].recipients[0])
        
    
    def test_emailChangeInit_email_to_old_address_is_formatted_correctly(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        message = self.controller.mail.outbox[0]
        self.assertTrue(message.body.startswith("oldDear "))
        self.assertIn(self.user.email, message.body)
        self.assertTrue(message.html.startswith("oldhtml "))
        self.assertIn(self.user.email, message.html)
        self.assertIn(self.oldEmailAddress, message.body)
        self.assertIn(self.newEmailAddress, message.body)


    
    def test_emailChangeInit_email_to_new_address_is_formatted_correctly(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        message = self.controller.mail.outbox[1]
        self.assertTrue(message.body.startswith("newDear "))
        self.assertIn(self.user.email, message.body)
        self.assertTrue(message.html.startswith("newhtml "))
        self.assertIn(self.user.email, message.html)
        self.assertIn(self.oldEmailAddress, message.body)
        self.assertIn(self.newEmailAddress, message.body)

    
    def test_emailChangeInit_does_not_change_email_address(self):
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        user = User.get(self.user.userid)
        self.assertEqual(self.oldEmailAddress, self.user.email)
        self.assertEqual(self.oldEmailAddress, user.email)

    

    def create_NowString(self):
        return str(time.time() - 1) + ":" + uuid4().hex

    def test_emailChangeInit_clears_timed_out_changeemail_credentials(self):
        for someone in User.query.all()[:5]:  # @UndefinedVariable
            Credential.new(someone, 'changeemail', self.create_NowString(), uuid4().hex)
        self.assertTrue(self.countExpiredCreds('changeemail')>=5)
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        self.assertTrue(self.countExpiredCreds('changeemail')==0)

    
    def test_emailChangeInit_clears_timed_out_changeemailandverify_credentials(self):
        for someone in User.query.all()[:5]:  # @UndefinedVariable
            Credential.new(someone, 'changeemailandverify', self.create_NowString(), uuid4().hex)
        self.assertTrue(self.countExpiredCreds('changeemailandverify')>=5)
        self.controller.emailChangeInit(self.newEmailAddress, self.user)
        self.assertTrue(self.countExpiredCreds('changeemailandverify')==0)

    
    def test_confirmChangeEmail_throws_403_bad_secret_for_email_change_if_secret_is_not_correct(self):
        with self.assertRaises(ReportedError) as context:
            self.doConfirmChangeEmail(secret="badSecret")
        self.assertEqual(context.exception.status,403)
        self.assertEqual(context.exception.descriptor,badChangeEmailSecret)

    
    def test_confirmChangeEmail_changes_email_address_to_the_new_one(self):
        self.doConfirmChangeEmail()
        user = User.get(self.user.userid)
        self.assertEqual(self.newEmailAddress, user.email)

    
    def test_confirmChangeEmail_does_not_change_email_address_to_the_new_one_if_confirm_is_false(self):
        self.doConfirmChangeEmail(confirm=False)
        user = User.get(self.user.userid)
        self.assertEqual(self.oldEmailAddress, user.email)

    
    def test_confirmChange_message_is_appropriate_if_confirm_is_false(self):
        resp = self.doConfirmChangeEmail(confirm=False)
        self.assertEqual(json.loads(self.getResponseText(resp))["message"], emailChangeIsCancelled)

    
    def test_confirmChange_message_is_appropriate_if_confirm_is_true(self):
        resp = self.doConfirmChangeEmail()
        self.assertEqual(json.loads(self.getResponseText(resp))["message"], emailChanged)

    
    def test_confirmChangeEmail_deletes_changeemail_credential(self):
        self.doConfirmChangeEmail()
        self.assertEqual(None,Credential.getByUser(self.user, 'changeemail'))

    
    def test_confirmChangeEmail_deletes_changeemailandverify_credential(self):
        self.doConfirmChangeEmail()
        self.assertEqual(None,Credential.getByUser(self.user, 'changeemailandverify'))

    
    def test_confirmChangeEmail_deletes_emailverification_assurance(self):
        self.doConfirmChangeEmail()
        self.assertEqual(list(),Assurance.listByUser(self.user,'emailverification'))

    
    def test_confirmChangeEmail_deletes_changeemail_credential_even_when_confirm_is_false(self):
        self.doConfirmChangeEmail(confirm=False)
        self.assertEqual(None,Credential.getByUser(self.user, 'changeemail'))

    
    def test_confirmChangeEmail_deletes_changeemailandverify_credential_even_when_confirm_is_false(self):
        self.doConfirmChangeEmail(confirm=False)
        self.assertEqual(None,Credential.getByUser(self.user, 'changeemailandverify'))

    
    def test_confirmChangeEmail_sends_an_email_to_the_new_address_with_a_security_warning(self):
        self.doConfirmChangeEmail()
        message = self.controller.mail.outbox[3]
        self.assertEqual(self.oldEmailAddress,self.controller.mail.outbox[0].recipients[0])
        self.assertTrue(message.body.startswith("warnDear "))
        self.assertIn(self.user.email, message.body)
        self.assertTrue(message.html.startswith("warnhtml "))
        self.assertIn(self.user.email, message.html)

    
    def test_confirmChangeEmail_starts_an_emailverification_for_the_new_address_if_called_with_changeemail_secret(self):
        self.doConfirmChangeEmail()
        self.assertEqual(self.user,Credential.getByUser(self.user, 'emailcheck').user)

    
    def test_confirmChangeEmail_adds_a_emailverification_assurance_if_called_with_changeemailandverify_secret(self):
        self.doConfirmChangeEmail(useverifysecret=True)
        self.assertIn("emailverification",Assurance.getByUser(self.user))

    
    def test_confirmChangeEmail_email__is_formatted_correctly(self):
        self.doConfirmChangeEmail()
        message = self.controller.mail.outbox[3]
        self.assertIn(self.oldEmailAddress, message.body)
        self.assertIn(self.newEmailAddress, message.body)
        self.assertIn(self.oldEmailAddress, message.html)
        self.assertIn(self.newEmailAddress, message.html)
