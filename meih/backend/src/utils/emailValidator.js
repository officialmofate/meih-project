const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'guerrillamail.net',
  'temp-mail.org', 'fakeinbox.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'dispostable.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'mailinator.com', 'maildrop.cc', 'tempail.com', 'tempomail.fr',
  'discard.email', 'discardmail.com', 'mailnesia.com', 'temp-mail.io',
  'throwaway.email', 'mohmal.com', 'getnada.com', 'emailondeck.com',
  '10minutemail.com', 'tempinbox.com', 'trashmail.com', 'trashmail.net',
  'trashmail.org', 'mailnull.com', 'mailsac.com', 'harakirimail.com',
  'tmail.ws', 'tmpmail.net', 'tmpmail.org', 'tmpmail2.com',
  'tempmailo.com', 'tmpmailer.com', 'tempr.email', 'discardmail.de',
  'spambox.us', 'spamgourmet.com', 'spaml.com', 'mailexpire.com',
  'mailcatch.com', 'jetable.org', 'jetable.fr.nf', 'jetable.com',
  'mytemp.email', 'tempmailer.com', 'tempmailer.de', 'tempomail.fr',
  'discard.email', 'fakeinbox.com', 'temp-mail.ru', 'email-fake.cf',
  'email-fake.com', 'email-fake.gq', 'email-fake.ml', 'email-fake.tk',
  'binkmail.com', 'bobmail.info', 'chammy.info', 'devnullmail.com',
  'letthemeatspam.com', 'letsbefriends.xyz', 'lovemeleaveme.com',
  'pookmail.com', 'safetymail.info', 'spamfree24.org', 'supermailer.jp',
  'tradermail.info', 'veryreallyreal.com', 'wegwerfmail.de',
  'wegwerfmail.net', 'wegwerfmail.org', 'wishyfish.com',
]);

const FREE_MAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
  'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'proton.me',
  'zoho.com', 'gmx.com', 'yandex.com', 'qq.com', '163.com',
  'naver.com', 'daum.net', 'hanmail.net', 'rediffmail.com',
  'tutanota.com', 'tutanota.de', 'tutamail.com', 'mail.com',
  'email.com', 'freeserve.email', 'windowslive.com', 'msn.com',
  'me.com', 'ymail.com', 'rocketmail.com', 'yahoo.co.uk',
  'yahoo.co.in', 'gmail.co.uk', 'outlook.co.uk', 'hotmail.co.uk',
  'googlemail.com', 'fastmail.com', 'runbox.com', 'hey.com',
]);

const DISPOSABLE_TLDS = new Set(['.tk', '.ml', '.ga', '.cf', '.gq']);

function isValidEmailFormat(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!re.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (!domain || !domain.includes('.')) return false;
  const labels = domain.split('.');
  for (const label of labels) {
    if (!label || label.length > 63) return false;
    if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
  }
  return true;
}

function getDomain(email) {
  return email.split('@')[1]?.toLowerCase() || '';
}

function validateEmail(email) {
  const errors = [];

  if (!email || typeof email !== 'string') {
    return { valid: false, errors: ['Email is required'] };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length > 254) {
    errors.push('Email address is too long');
  }

  if (!isValidEmailFormat(trimmed)) {
    errors.push('Invalid email format');
    return { valid: false, errors };
  }

  const domain = getDomain(trimmed);

  if (DISPOSABLE_DOMAINS.has(domain)) {
    errors.push('Disposable email addresses are not allowed');
  }

  const tld = '.' + domain.split('.').pop();
  if (DISPOSABLE_TLDS.has(tld)) {
    errors.push('Email domains from this TLD are not allowed');
  }

  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    errors.push('Email address cannot start or end with a dot');
  }

  if (trimmed.includes('..')) {
    errors.push('Email address cannot contain consecutive dots');
  }

  return {
    valid: errors.length === 0,
    errors,
    email: trimmed,
    domain,
    isFreeMail: FREE_MAIL_DOMAINS.has(domain),
    isDisposable: DISPOSABLE_DOMAINS.has(domain) || DISPOSABLE_TLDS.has(tld),
  };
}

module.exports = { validateEmail, isValidEmailFormat, DISPOSABLE_DOMAINS, FREE_MAIL_DOMAINS };
