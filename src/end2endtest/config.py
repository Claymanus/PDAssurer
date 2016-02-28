# encoding: utf-8
import os
import tempfile

def absolutePathForEnd2EndResource(fileName):
    return os.path.join(os.path.dirname(__file__), "..", "end2endtest", fileName)

class Config(object):
    DEBUG = False
    TESTING = False
    CSRF_ENABLED = False
    SECRET_KEY = 'test secret'
    SQLALCHEMY_DATABASE_URI = "postgres:///root"
    AUTHCODE_EXPIRY = 60
    WTF_CSRF_ENABLED = False
    MAIL_PORT = 1025
    SERVER_EMAIL_ADDRESS = "test@edemokraciagep.org"
    BASE_URL = "https://local.sso.edemokraciagep.org:8888"
    BACKEND_PATH = "/ada"
    COOKIE_DOMAIN = "local.sso.edemokraciagep.org"
    SSL_LOGIN_BASE_URL = "https://local.sso.edemokraciagep.org:8889"
    SSL_LOGOUT_URL = "https://local.sso.edemokraciagep.org:8889/ssl_logout/"
    START_URL = "{0}/static/login.html".format(BASE_URL)
    PASSWORD_RESET_FORM_URL = START_URL
    FACEBOOK_APP_ID = "1632759003625536"
    FACEBOOK_APP_SECRET = "2698fa37973500db2ae740f6c0005601"
    CA_CERTIFICATE_FILE = absolutePathForEnd2EndResource("server.crt")
    CA_KEY_FILE = absolutePathForEnd2EndResource("server.key")
    SERVICE_NAME = "eDemokrácia SSO"
    DEREGISTRATION_URL = START_URL
    EMAIL_DOMAIN = "local.sso.edemokraciagep.org"
#    ANCHOR_URL = "https://anchor.edemokraciagep.org/"
    ANCHOR_URL = "https://local.sso.edemokraciagep.org:8890/"

testSignatureAllOne = "d60d076693f99692539bc67e4b28aea33e0fc51b67ec68762716b57f58621852a6ef643b2b7bbcba0ae6acbb7f893122d47d87ae29c17413bb42ab0bba7d88b4"
testSignatureAllTwo = "72bd4a1260f51aa6172862c1431e5e2537bf2d65ed74b9b76e4410760901f87cf892bb2621fa4d5d08e85a641ee8bc1026de8660caa61f4f206cd898c7ec6ef6"
skipSlowTests = False
skipFacebookTests = False
#fbuser does not allow email for the fb app, fbuesr2 does
fbuser = "mag+tesztelek@magwas.rulez.org"
fbpassword = "Elek the tester"
fbuserid = "111507052513637"
fbuser2 = "mag+elekne@magwas.rulez.org"
fbpassword2 = "Elekne is tesztel"
ca_certs = "src/end2endtest/server.crt"
