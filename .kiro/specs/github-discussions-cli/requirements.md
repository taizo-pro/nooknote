# Requirements Document

## Introduction

GitHub Discussionsでのメモ取りを効率化するため、ブラウザを開かずに直接GitHub Discussionsにアクセスし、コメントを投稿できるツールを開発する。CLIツールとmacOSネイティブアプリケーションの両方を提供し、開発者の作業フローを中断することなく、迅速にメモやコメントを残すことができる。

## Requirements

### Requirement 1

**User Story:** 開発者として、ブラウザを開かずにGitHub Discussionsの一覧を確認したい。作業を中断せずに関連するディスカッションを素早く見つけられるようにするため。

#### Acceptance Criteria

1. WHEN ユーザーがCLIコマンドまたはmacOSアプリを使用する THEN システムは指定されたリポジトリのGitHub Discussions一覧を表示する SHALL
2. WHEN ディスカッション一覧が表示される THEN システムはタイトル、作成者、作成日時、コメント数を含む SHALL
3. IF リポジトリが指定されていない THEN システムはデフォルトリポジトリまたは設定されたリポジトリを使用する SHALL
4. WHEN macOSアプリが使用される THEN システムはネイティブUIでディスカッション一覧を表示する SHALL

### Requirement 2

**User Story:** 開発者として、CLIまたはmacOSアプリから直接GitHub Discussionsにコメントを投稿したい。ブラウザを開く手間を省き、開発フローを維持するため。

#### Acceptance Criteria

1. WHEN ユーザーがディスカッションIDとコメント内容を指定する THEN システムはそのディスカッションにコメントを投稿する SHALL
2. WHEN コメント投稿が成功する THEN システムは投稿されたコメントのURLを表示する SHALL
3. IF 認証が必要な場合 THEN システムはGitHub Personal Access Tokenを使用して認証を行う SHALL
4. IF コメント投稿に失敗する THEN システムは適切なエラーメッセージを表示する SHALL
5. WHEN macOSアプリが使用される THEN システムはテキストエディタUIでコメント作成を提供する SHALL

### Requirement 3

**User Story:** 開発者として、特定のディスカッションの詳細とコメントを確認したい。コンテキストを理解してから適切なコメントを投稿するため。

#### Acceptance Criteria

1. WHEN ユーザーがディスカッションIDを指定する THEN システムはそのディスカッションの詳細を表示する SHALL
2. WHEN ディスカッション詳細が表示される THEN システムは本文、既存のコメント、参加者情報を含む SHALL
3. WHEN コメントが複数ある場合 THEN システムは時系列順でコメントを表示する SHALL

### Requirement 4

**User Story:** 開発者として、新しいディスカッションを作成したい。新しいトピックについて議論を開始するため。

#### Acceptance Criteria

1. WHEN ユーザーがタイトルと本文を指定する THEN システムは新しいディスカッションを作成する SHALL
2. WHEN ディスカッション作成が成功する THEN システムは作成されたディスカッションのURLを表示する SHALL
3. IF カテゴリが指定されている場合 THEN システムは指定されたカテゴリでディスカッションを作成する SHALL

### Requirement 5

**User Story:** 開発者として、GitHub認証を安全に管理したい。セキュリティを保ちながら継続的にツールを使用するため。

#### Acceptance Criteria

1. WHEN 初回使用時 THEN システムはGitHub Personal Access Tokenの設定を求める SHALL
2. WHEN トークンが設定される THEN システムは安全な場所（設定ファイルまたは環境変数）にトークンを保存する SHALL
3. IF トークンが無効または期限切れの場合 THEN システムは適切なエラーメッセージと再設定の案内を表示する SHALL
4. WHEN API呼び出しを行う THEN システムは適切な権限スコープ（repo、discussionsアクセス）を使用する SHALL

### Requirement 6

**User Story:** 開発者として、CLIとmacOSアプリの両方で一貫した体験を得たい。どちらのインターフェースを使用しても同じ機能にアクセスできるようにするため。

#### Acceptance Criteria

1. WHEN 機能がCLIで利用可能な場合 THEN 同じ機能がmacOSアプリでも利用可能である SHALL
2. WHEN 設定がCLIで変更される THEN macOSアプリでも同じ設定が反映される SHALL
3. WHEN macOSアプリで設定が変更される THEN CLIでも同じ設定が反映される SHALL
4. WHEN エラーが発生する THEN CLIとmacOSアプリで一貫したエラーメッセージが表示される SHALL