import * as qz from "qz-tray";

function decodePrivateKey(pem) {
    const encodedKey = pem
        .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
    const binaryKey = atob(encodedKey);
    return Uint8Array.from(binaryKey, (character) => character.charCodeAt(0));
}

export function configureQZ() {
    const privateKey = getPrivateKey();
    const signingKey = window.crypto.subtle.importKey(
        "pkcs8",
        decodePrivateKey(privateKey),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
        false,
        ["sign"]
    );

    qz.security.setSignatureAlgorithm("SHA512"); // Since 2.1
    qz.security.setSignaturePromise(function (toSign) {
        return async function (resolve, reject) {
            try {
                const key = await signingKey;
                const signature = await window.crypto.subtle.sign(
                    "RSASSA-PKCS1-v1_5",
                    key,
                    new TextEncoder().encode(toSign)
                );
                resolve(btoa(String.fromCharCode(...new Uint8Array(signature))));
            } catch (err) {
                reject(err);
            }
        };
    });

    const certificate = getCertificate();
    qz.security.setCertificatePromise((resolve) => {
        resolve(certificate);
    });

}


function getPrivateKey() {
    return (
        "-----BEGIN PRIVATE KEY-----\n" +
        "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMvQj8llyHpKTh\n" +
        "sCBF5UZAFqJMSqsM+w78/uXVecygpnq4OyTwZTvAnKHmZjMSFeuJYolbS/OdAMiQ\n" +
        "Rjtfek8UmwrmTmo6shvvZW0z1M8/Io1fZ0PBcCNZXgV0tFAaAyZZ7totDyw8oaYL\n" +
        "TRw8riKdxaeWLaq5n+bp8xhFSpu19Wfnr0cDMxLwnx/H/HnRG7A7JfOq25k48CsI\n" +
        "KoCiwDxBR4K3RrY7F1rYl6THQY3xcFtt8uQpTXbSYnIk+PCWYr5/cKLR1shLNKH3\n" +
        "L67I0LDbLx5jeqfo5afaciIgqASe0Tgkxe+awgppdRnWb5YWT8GAr2g9t8kyARVV\n" +
        "mPYLNLQzAgMBAAECggEAQ4ke+97HrkvC145mHkRkjrKN1WBrbsI3Mg67idJ18I2T\n" +
        "DD9NfZKGtuozAtX+Ieqk6XuAgHAVCj1rAVjCexG9Sx0PgO8WKO55W0rnuVygyyIw\n" +
        "hxyNthCy1dq5cYRpf+INEFD/H2pNhxbnEDtDlpbVg7JqtjVZ3NOvwopmFjI0QH85\n" +
        "x1fNaVpUOyp0V/QzI6w5/um08Rcl6/81SMB7re+0KHs2LlGq9znAEnSDvyBORcze\n" +
        "ZbXop9i+u1iMCVHDjt/lhb9yDitsZif6ZGX8VdiJD97orxOvuVglsRcMaI470VQu\n" +
        "AlFgqHdSvuE14ALRwD718Lc45yuLMae/z57LxjOfgQKBgQDD1KxqhdOMzdMMIg2g\n" +
        "kvEeW28fXjh4kpybwVZO+wf45EHNe6sBqIvPfXv0sLd+ZXDd+0RkyjVFnbenFd6l\n" +
        "zDIUgG7dnTLdz07ZX6PBr9WoQnE79UvFp0Y99VakXZPZcQ7Hc04SKZJMoMFf8CP+\n" +
        "CNHt9WgVHT/zo0yCGO7CAFIU8wKBgQC3+wBIaSezvcGBtT+U/RUsCg/NbkN0wsZ0\n" +
        "rt7FzX7CoAue1b5SuoHpgNuCV98v87XvFHcC3qGeLWdjuIBKFaVNHJJ+83VGvWgU\n" +
        "JVpxvBo2DmAfH6K8ekNU8sj0Ps3VqWicWl+bhjyy4fYaYhXSbN9FTjOe1+tZKn4G\n" +
        "LE5rc9+zwQKBgQC+li6vBUucD3zEpCerDRdJOidt2d8PyXBNTd5Xw4xAuLUp7J/D\n" +
        "X2uiJjgLLimHA+bSw4YOqZUrCZIBNRGZPp/GwDAl0qX8pZPRjnjrOduwg+l8NwDl\n" +
        "fiSojCskkEYiKxv9FMT4fCj8Fr/cRPRieecFtf7z/aGN1nHRc756ZKF97QKBgCFj\n" +
        "DmEVnBvVIqmcL6ak6tOsG8QG73zf383K8ihpK0i8bH9tgHVY3Tx3ot4bfiggjPKO\n" +
        "/y3pIuEmki2ZjMZk+TNuLPOW0MB+nMWTJb+gCA2pPC5JummDsnZW/Lq+LvJIJPDC\n" +
        "wbjiel9n/BY7mIQwN7BHCb0Yp9/tgyMxpSWAyKbBAoGAbre1mFrN3aiovHDQY32c\n" +
        "I9teRUPdcNJTxIgLyre1fWQy7Sgjjyh9hopSWzJGk/3QukitbcA2nuVhbz/GIrty\n" +
        "ujAZATT34H1pIi2G3JBf1pgXioo/+EkEFIuCBxPiQvlkFujYD3HDyTwMXv6jG30x\n" +
        "yexA9TBKwtgFbgPoDwrMN8g=\n" +
        "-----END PRIVATE KEY-----"
    );
}

function getCertificate() {
    return (
        "-----BEGIN CERTIFICATE-----\n" +
        "MIIECzCCAvOgAwIBAgIGAZkVovzWMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQG\n" +
        "EwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwS\n" +
        "UVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMx\n" +
        "HDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkg\n" +
        "RGVtbyBDZXJ0MB4XDTI1MDkwMzE2NTAyN1oXDTQ1MDkwMzE2NTAyN1owgaIxCzAJ\n" +
        "BgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYD\n" +
        "VQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMs\n" +
        "IExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVog\n" +
        "VHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCM\n" +
        "vQj8llyHpKThsCBF5UZAFqJMSqsM+w78/uXVecygpnq4OyTwZTvAnKHmZjMSFeuJ\n" +
        "YolbS/OdAMiQRjtfek8UmwrmTmo6shvvZW0z1M8/Io1fZ0PBcCNZXgV0tFAaAyZZ\n" +
        "7totDyw8oaYLTRw8riKdxaeWLaq5n+bp8xhFSpu19Wfnr0cDMxLwnx/H/HnRG7A7\n" +
        "JfOq25k48CsIKoCiwDxBR4K3RrY7F1rYl6THQY3xcFtt8uQpTXbSYnIk+PCWYr5/\n" +
        "cKLR1shLNKH3L67I0LDbLx5jeqfo5afaciIgqASe0Tgkxe+awgppdRnWb5YWT8GA\n" +
        "r2g9t8kyARVVmPYLNLQzAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYD\n" +
        "VR0PAQH/BAQDAgEGMB0GA1UdDgQWBBQtGrPWAlZ/T96tFuEhJuEnc2khCTANBgkq\n" +
        "hkiG9w0BAQsFAAOCAQEASaEyNDjndiFhUpYfNmEJgyONpCY+xaoP3NcXSn0E/NIG\n" +
        "HWMnBCFduGOw+fr84XRhJEG2Gm1giS4GM/K1TvkhE/YZRQbQQ91T8QUBdnN/25/3\n" +
        "58DBUGvwsX9zMMl0mU6Cl1TWi8EFezMzcIZq5AUIxOmdo8TAQuZauxtv+XiwJjpN\n" +
        "0/NncRWUHgQpHG5j6NQbe4ngE4RWW/+GxwW1gPT5qKtUg5l9pTgFVAylVZ/EtcAN\n" +
        "70aI1Ah/84SAhlrRns8UQpWFahvWv54Isiaz8SExGT9yk35AVxttOyBQvd6MGxmd\n" +
        "ez2fS80MVR00NrU+NsqKDyzI5AMocv5jPOnRQ7UEDA==\n" +
        "-----END CERTIFICATE-----"
    );
}
