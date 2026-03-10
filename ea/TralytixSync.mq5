//+------------------------------------------------------------------+
//|  TralytixSync.mq5                                                |
//|  Tralytix — Live Trade Sync Expert Advisor v1.0                  |
//|                                                                  |
//|  INSTALLATION:                                                   |
//|  1. Ouvre MetaTrader 5                                           |
//|  2. File > Open Data Folder > MQL5 > Experts                     |
//|  3. Copie ce fichier dans ce dossier                             |
//|  4. Dans MT5: Tools > Options > Expert Advisors                  |
//|     Coche "Allow WebRequest for listed URL:"                     |
//|     Ajoute: https://tralytix.onrender.com                        |
//|  5. Attache l'EA sur n'importe quel graphique (ex: EURUSD M1)    |
//|  6. Colle ton token Tralytix dans le champ "TralytixToken"       |
//|  7. Active le trading automatique (bouton "AutoTrading")         |
//+------------------------------------------------------------------+
#property copyright "Tralytix"
#property link      "https://tralytix.io"
#property version   "1.00"
#property description "Synchronise tes trades MT5 vers Tralytix en temps réel."

//--- Paramètres utilisateur
input string TralytixToken = "";                                    // Token Tralytix (obligatoire)
input string TralytixURL   = "https://tralytix.onrender.com";       // URL API (ne pas modifier)
input bool   DebugMode     = false;                                 // Afficher logs détaillés

//--- Variables globales
string g_endpoint;

//+------------------------------------------------------------------+
int OnInit()
{
   g_endpoint = TralytixURL + "/v1/integrations/mt5/live";

   if(StringLen(TralytixToken) == 0)
   {
      Alert("Tralytix: Token manquant. Obtiens ton token sur tralytix.io/mt5");
      return INIT_PARAMETERS_INCORRECT;
   }

   Print("Tralytix Sync démarré. Surveillance des trades active.");
   Print("Endpoint: ", g_endpoint);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Tralytix Sync arrêté. Raison: ", reason);
}

//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest     &request,
                        const MqlTradeResult      &result)
{
   // On ne traite que les deals ajoutés à l'historique
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD)
      return;

   ulong dealTicket = trans.deal;
   if(!HistoryDealSelect(dealTicket))
   {
      if(DebugMode) Print("Tralytix: impossible de sélectionner le deal ", dealTicket);
      return;
   }

   SyncDeal(dealTicket);
}

//+------------------------------------------------------------------+
void SyncDeal(ulong dealTicket)
{
   // Récupération des données du deal
   string symbol     = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
   double volume     = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
   double price      = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
   double profit     = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
   double swap       = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
   long   dealType   = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
   long   dealEntry  = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
   datetime dealTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
   ulong  posID      = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
   string comment    = HistoryDealGetString(dealTicket, DEAL_COMMENT);

   // Détermination du sens
   string side = (dealType == DEAL_TYPE_BUY) ? "BUY" : "SELL";

   // Détermination de l'événement
   string event;
   bool   isClosed = false;
   if(dealEntry == DEAL_ENTRY_IN)
   {
      event = "trade_opened";
   }
   else if(dealEntry == DEAL_ENTRY_OUT || dealEntry == DEAL_ENTRY_OUT_BY)
   {
      event    = "trade_closed";
      isClosed = true;
   }
   else
   {
      event = "trade_modified";
   }

   // Conversion des timestamps en RFC3339
   string openedAtStr = FormatTime(dealTime);
   string closedAtStr = "";
   if(isClosed) closedAtStr = openedAtStr;

   // Recherche du prix d'ouverture depuis l'historique des positions
   double openPrice  = price;
   double closePrice = 0.0;

   if(isClosed)
   {
      closePrice = price;
      // Chercher le prix d'ouverture dans l'historique
      if(HistorySelectByPosition(posID))
      {
         int totalDeals = HistoryDealsTotal();
         for(int i = 0; i < totalDeals; i++)
         {
            ulong ticket = HistoryDealGetTicket(i);
            if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_IN &&
               HistoryDealGetInteger(ticket, DEAL_POSITION_ID) == (long)posID)
            {
               openPrice    = HistoryDealGetDouble(ticket, DEAL_PRICE);
               datetime ot  = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
               openedAtStr  = FormatTime(ot);
               break;
            }
         }
      }
   }

   // Échapper le commentaire pour JSON
   StringReplace(comment, "\"", "\\\"");

   // Construction du payload JSON
   string json = StringFormat(
      "{\"event\":\"%s\","
      "\"ticket\":\"%I64u\","
      "\"position_id\":\"%I64u\","
      "\"symbol\":\"%s\","
      "\"side\":\"%s\","
      "\"volume\":%.4f,"
      "\"open_price\":%.5f,"
      "\"close_price\":%.5f,"
      "\"opened_at\":\"%s\","
      "\"closed_at\":\"%s\","
      "\"profit\":%.2f,"
      "\"commission\":%.2f,"
      "\"swap\":%.2f,"
      "\"comment\":\"%s\"}",
      event,
      dealTicket,
      posID,
      symbol,
      side,
      volume,
      openPrice,
      closePrice,
      openedAtStr,
      closedAtStr,
      profit,
      commission,
      swap,
      comment
   );

   if(DebugMode) Print("Tralytix payload: ", json);

   SendToAPI(json, event, symbol);
}

//+------------------------------------------------------------------+
void SendToAPI(string json, string event, string symbol)
{
   char   dataOut[];
   char   dataIn[];
   string resultHeaders;
   string headers = "Content-Type: application/json\r\nX-EA-Token: " + TralytixToken;

   StringToCharArray(json, dataOut, 0, StringLen(json));

   int statusCode = WebRequest(
      "POST",
      g_endpoint,
      headers,
      10000,   // timeout 10s
      dataOut,
      dataIn,
      resultHeaders
   );

   if(statusCode == 200 || statusCode == 201)
   {
      Print("Tralytix: [OK] ", event, " - ", symbol, " synced.");
   }
   else if(statusCode == 401)
   {
      Alert("Tralytix: Token invalide. Vérifie ton token dans les paramètres de l'EA.");
   }
   else
   {
      Print("Tralytix: [ERR] HTTP ", statusCode, " - ", event, " - ", symbol);
      if(DebugMode)
      {
         string response = CharArrayToString(dataIn);
         Print("Tralytix response: ", response);
      }
   }
}

//+------------------------------------------------------------------+
string FormatTime(datetime t)
{
   MqlDateTime dt;
   TimeToStruct(t, dt);
   return StringFormat(
      "%04d-%02d-%02dT%02d:%02d:%02dZ",
      dt.year, dt.mon, dt.day,
      dt.hour, dt.min, dt.sec
   );
}
//+------------------------------------------------------------------+
