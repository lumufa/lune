interface IAppOption {
  globalData: {
    apiBaseUrl: string;
    userId: string;
    releaseChannel: string;
    envVersion: "develop" | "trial" | "release";
    usesDemoUser: boolean;
  };
  editRecordId?: string;
}
