<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="content-style-type" content="text/css" />
<meta http-equiv="content-script-type" content="text/javascript" />
<meta http-equiv="content-language" content="ja" />
<meta name="author" content="東京荒川区/日暮里、西日暮里 ”LGBTフレンドリー床屋”" lang="ja" xml:lang="ja" />
<meta name="copyright" content="LGBT frinendly Tokoya & Head Spa" />
<meta name="robots" content="index, follow" />
<meta name="keywords" content="東京荒川区/日暮里、西日暮里 ”LGBTフレンドリー床屋”" lang="ja" xml:lang="ja" />
<meta name="description" content="東京荒川区/日暮里、西日暮里 ”LGBTフレンドリー床屋”" lang="ja" xml:lang="ja" />
<title>ご予約お問い合わせフォーム ｜ 東京荒川区/日暮里、西日暮里 ”LGBTフレンドリー床屋”</title>
<link rel="shortcut icon" type="image/ico" href="/favicon.ico" />
<link rel="stylesheet" href="/css/default.css?2305" type="text/css" media="screen,print" />
<link rel="stylesheet" href="/css/print.css" type="text/css" media="print" />
<script type="text/javascript" src="/js/jquery.js"></script>
<script type="text/javascript" src="/js/common.js"></script>
<script type="text/javascript" src="/js/jquery.easing.1.3.js"></script>
<style>
*{font-size:100.3%!important;}

.price dt,
.price dd{
	font-size: 120%!important;
}</style>
</head>
<body id="reservation">
<div id="wrapper">
  <?PHP include ("../inc_header.php"); ?>
  <div id="contents" class="cf">
    <div id="mainContents">
      <h1><img src="image/h1_reservation.gif" alt="ご予約お問い合わせフォーム" /></h1>
      <div class="section1">
        <p>事前予約制となっております。<br />
        (ご希望日時は、第1希望から第3希望までお書き下さい。)<br />
        また、ご予約可能日はお知らせブログをご覧ください。<br />
1日たっても返信されない場合は、<a href="mailto:lgbt1world.family@gmail.com">lgbt1world.family@gmail.com</a> に再度御連絡お願いいたします。<br />
初回はメール予約のみお受けいたします。<br />
          下記フォームに必要事項を入力後、確認ボタンを押してください。</p>
        <p class=" mIndent2">※どうしても質問がある場合は電話番号を下記フォームに記載してください。<br />
          こちらからお電話いたします。</p>
        <form method="post" action="mail.php">
<script src="https://www.google.com/recaptcha/api.js?render=6LcGYOgUAAAAAKemxjnYbSsPGCfNErsnhltES6NQ"></script>
<script>
grecaptcha.ready(function() {
    grecaptcha.execute('6LcGYOgUAAAAAKemxjnYbSsPGCfNErsnhltES6NQ', {action: 'homepage'}).then(function(token) {
 var recaptchaResponse = document.getElementById('recaptchaResponse');
      recaptchaResponse.value = token;
    });
});
</script>
          <table class="formTable">
            <tr>
              <th>お名前</th>
              <td><input type="text" name="お名前" /></td>
            </tr>
             <tr>
              <th>セクシュアリティ</th>
              <td><input type="text" name="セクシュアリティ" /></td>
            </tr>
            <tr>
              <th>メールアドレス</th>
              <td><input type="text" name="メールアドレス" />
                <br />
                ※半角でご入力ください。</td>
            </tr>
            <tr>
              <th>電話番号</th>
              <td><input type="text" name="TEL" />
                <br />
                ※半角でご入力ください。</td>
            </tr>
            <tr>
              <th>ご希望日時</th>
              <td><textarea name="ご希望日時" cols="60" rows="3"></textarea></td>
            </tr>
            <tr>
              <th>カットご希望</th>
              <td><input type="checkbox" name="cut" value="希望なし"> 希望なし　<input type="checkbox" name="cut" value="愛太郎店長カット"> 愛太郎店長カット<input type="checkbox" name="cut" value="ゆきこチーフカット"> ゆきこチーフカット
</td>
            </tr>
          </table>
          <div class="btnLayout">
            <input type="submit" value="確認ページへ進む" />
<input type="hidden" name="recaptchaResponse" id="recaptchaResponse" />
          </div>
        </form>
      </div>
      <div class="toTop"><a href="#wrapper">ページトップへ</a></div>
    </div>
    <!-- /div#mainContents -->
    <?PHP include ("../inc_sub.php"); ?>
  </div>
  <!-- /div#contents -->
  <?PHP include ("../inc_footer.php"); ?>
</div>
<!-- /div#wrapper -->



</body>
</html>
