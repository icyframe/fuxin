export default {
	myVar1: [],
	myVar2: {},
	myVar3:{gather: 0, birthday: '', age:'',currentDate:''},
	cardTypeLabel:{
		0:"未知",
		1:"身份证",
		2:"体检卡号",
		3:"电子健康卡",
		4:"港澳通行证",
		5:"护照"
	},
	initCal:async()=>{
		storeValue('PERSIONSEX', '(1,2,0)',false);
	},
	a:()=>{
		storeValue('resultHisSerialCode', '1536669');
	},
	//获取套餐项目详情
	getTcInfo: async () => {
		var yx = await yxtc.run();  
		const storeAppendSubject = await appsmith.store.TableXq || [];
		//是否套餐包含的项目 1是 0否
		var filteredItemId = [];
		const filteredAppendSubject = await storeAppendSubject.filter(item => item.ADD_FLAG !== 1 && filteredItemId.push(item.ID))

		var yxAll = [];
		await yx.forEach((item) => {
			if(!filteredItemId.includes(item.ID)){
				yxAll.push(item);
			}
		})
		
		
		const ret = await [...yxAll, ...filteredAppendSubject];
		let countPrice =0.00;
		let projectIdList = ret.map(function(value,index) {
			//const ZK = //value.ZK;
			countPrice += parseFloat(parseFloat(value.BZJG) );
        return value['ID'];
    });
		storeValue('countsjPrice',countPrice.toFixed(2),false);
		storeValue('regProjectIdList', '('+projectIdList.join(',')+')', false);
		await storeValue('TableXq', ret, false);
	},
	//获取选择项目信息
	getInfo: () => {
		var rNew = Table2.selectedRow;

		delete rNew.customColumn1;
		const storeAppendSubject = appsmith.store.TableXq || [];
		if (!storeAppendSubject.length) {
		  storeValue('TableXq', [rNew], false);
			storeValue('regProjectIdList', '('+rNew+')', false);
		} else {
			const ne = [...storeAppendSubject, rNew];
			const res= new Map();
     	let ny = ne.filter((a)=> !res.has(a.ID) && res.set(a.ID,1));
			let countPrice = 0.00;
			let projectIdList = ny.map(function(value,index) {
				countPrice += parseFloat(parseFloat(value.BZJG) * value.ZK / 100);
        return value['ID'];
			});
			storeValue('countsjPrice',countPrice.toFixed(2),false);
			storeValue('regProjectIdList', '('+projectIdList.join(',')+')', false);
    	storeValue('TableXq', ny, false);
		}
	},
	jointFun: async (personId =1) => {
		const insertList = await Table3.tableData || [];
		let str = await `begin  `;
		//let zk = await Input2.text;
		//let reId = await getId.run();
		//	console.log(reId);
		//增加了个人费用和单位费用
		let personerMoney = await 0;
		let teamMoney = await 0;			
		await insertList.forEach((item) => {
			const { ID: xmID, BZJG, ZK, ADD_FLAG, TID } = item || {};
			const SJJG = (item?.BZJG / ( 100 / item.ZK)).toFixed(2);
			personerMoney = _.add(personerMoney, parseFloat(SJJG))

			str += `INSERT INTO REG_ITEM_INFO 	(ID,REG_ID,ITEM_ID,ACTUAL_PRICE,STANDARD_PRICE,DISCOUNT,PAY_STATUS,PAY_MODE,CHECK_STATUS,ADD_ITEM_FLAG,PKG_ID,DELETE_FLAG,OTHER_PRICE,OTHER_STATUS,PRICE_RECEIVED) 
						VALUES (substr(cast(dbms_random.value as varchar2(20)),2,10),'${personId}','${xmID}',${SJJG},${BZJG},${ZK},0,0,0,${ADD_FLAG},'${TID||''}',0,0,1,0) ;`;
		});
		str += await 'end;';
		await storeValue('insertXm', str, false)
		await storeValue('personerMoney', personerMoney, false)
    await storeValue('teamMoney', teamMoney, false)
		return str;
	},
	
		  // 批量插入
	batchInsert2: async () => {
		showModal('Modal2')
		//await getRegisterID.run();
		//console.log(localStorage);
		//console.log(globalState);
		await getReserialNo.run();
		const insertList = await Table3.tableData;
		const len = await insertList?.length ?? 0;
		if(len === 0 ){
			closeModal('Modal2')
			await showAlert('未选择体检项目!');
			return;
		}
		let fromVerferStatus = JSONForm1.fieldState;
		let fromData = JSONForm1.formData;
		for(let k in fromVerferStatus){
			if(fromVerferStatus[k].isRequired){
				console.log(fromVerferStatus[k]);
				if(fromData[k] == "undefined" || fromData[k] == ""){
					closeModal('Modal2')
					await showAlert('请填写必填项!');
					return;
				}
			}
		}
		//let reNo = await getReserialNo.data;
		//storeValue("reNo",reNo,false);
		const type = await JSONForm1.formData.card_type;
		await storeValue('personUserId', 0 , false)
		if(globalState.store.personUserId == undefined || globalState.store.personUserId == 0){
			// 根据序列获取 TJ_REGISTER_SEQ.NEXTVAL
			let personRegInfoId = await getPersonRegInfoId.run(); //用户id
			await storeValue('personUserId', getPersonRegInfoId.data[0].NEXTVAL , false)
			console.log(["userID1:",getPersonRegInfoId.data[0].NEXTVAL]);
			
		}else{
			console.log(["userID2:",globalState.store.personUserId]);
		}
		await this.jointFun(globalState.store.personUserId);//组装套餐项目费用
		
		//return  globalState.store.insertXm;

		//获取全局的是否启用HIS调用 '1'： 启用， '0'或 undefined: 关闭
		//let callHisFlagString = await globalState.store.callHisFlag;
		let hisFlagList = await GLOBAL_Query3.run();
		let callHisFlagString = await (!hisFlagList)?'0' : hisFlagList[0].IDE_VALUE??'0';
		let isHisFlag = await (!callHisFlagString) || '0'=== callHisFlagString;
		await console.log("==是否启用HIS调用( '1'： 启用， '0'或 undefined: 关闭)===callHisFlagString==isHisFlag==", callHisFlagString, isHisFlag)
		
		if(isHisFlag){
			 await storeValue('resultHisCode', '0', false)
			 console.log("==未启用his调用resultHisCode==", globalState.store.resultHisCode)
		}else{
			//HIS建档接口，获取PATIENT_ID(病人ID)   start
			if(globalState.store.resultHisCode == undefined ){
				const resultHis= await registerPersonApi.run();//录入his
				console.log("===建档返回HISresult1===:",resultHis);
				if(resultHis.ack.ackCode == "AE"){
					await showAlert('建档录入his失败!','error');
					return ;
				}
				await storeValue('resultHisCode', resultHis.ack.PATIENT_ARCHIVES_INFO.patient_id, false)
				console.log("===启用his调用resultHisCode1===:",globalState.store.resultHisCode);
			}else{
				console.log("===启用his调用resultHisCode2===:",globalState.store.resultHisCode);
			}
			//HIS建档接口，获取PATIENT_ID(病人ID)   end
		}

		//根据 获取的序列ID获取人员信息
		let resultFind = await getFindDJ.run();
		//console.log("444444444444444");
		if(getFindDJ.length > 0 && getFindDJ.data[0] && getFindDJ.data[0]['ID'] != null){
			await storeValue('hoverinfo', getFindDJ.data[0], false);
		}else{
			//写入项目
			await insertXm.run();
			//type 1 为身份证
			if(type === '1'){
				await getFileNo.run();
				const fileno = await getFileNo.data?getFileNo.data[0]['FILE_NO']:"";
				if(fileno != "" || fileno != undefined){
					storeValue('fileNO', fileno, false);
				}else{
					await getuuid.run();
					const fileno = await getuuid.data?getuuid.data[0]['UUID']:"";
				}
				storeValue('fileNO', fileno, false);
				await insert2.run();
			}else{
				await insert.run();
			}
			//根据 获取的序列ID获取人员信息
			let resultFind = await getFindDJ.run();
			storeValue('hoverinfo', getFindDJ.data[0], false);
		}
		console.log(["===用户建档完成:===",getFindDJ.data[0]]);
		
		if(await isHisFlag){
			 await storeValue('resultHisSerialCode', '0', false)
			 await console.log("==未启用his调用resultHisSerialCode==", globalState.store.resultHisSerialCode)
		}else{
			//HIS登记接口 ,获取VISIT_SERIAL_NO(就诊流水号) start
			if(await globalState.store.resultHisSerialCode == undefined ){
				const resultDjHis = await registeredUserApi.run();
				console.log("===登记返回resultDjHis===:",resultDjHis);
				if(resultDjHis.ack.ackCode == "AE"){
					await showAlert('登记录入his失败!','error');
					return ;
				}
				await storeValue('resultHisSerialCode', resultDjHis.ack.PHYSICAL_EXAM_VISIT_INFO.visit_serial_no, false)
				console.log("===启用his调用resultHisSerialCode1===:",globalState.store.resultHisSerialCode);
			}else{
				console.log("===启用his调用resultHisSerialCode2===:",globalState.store.resultHisSerialCode);
			}
		}
		saveHisLoginCodePerson.run();//修改HIS就诊流水号
		//HIS登记接口 ,获取VISIT_SERIAL_NO(就诊流水号) end
		
		await storeValue('personUserId', undefined, false);//用户id
		await storeValue('personerMoney', undefined, false)//个人缴费金额
        await storeValue('teamMoney', undefined, false)//单位缴费金额
		await storeValue('insertXm', undefined, false);//体检项目
		await storeValue('resultHisCode', undefined, false);//his建档id
		await storeValue('hoverinfo', undefined, false);//录入完成用户资料
		await storeValue('resultHisSerialCode', undefined, false);//就诊id
		await storeValue('TableXq', undefined, false);
		await storeValue('fileNO', undefined, false);
		
		closeModal('Modal2');
		await showAlert('登记成功!');
		await navigateTo('63ff1e901e79b060f0e7e40c', {}, 'URL_SELECT')
	},
	birthday: () => {
		let cardIdNo = JSONForm1.formData.card_id;
		let currentDate = new Date();
		let currentDateString = currentDate.getFullYear()+ '-' + (currentDate.getMonth()+1) + '-' + currentDate.getDate();
		if(parseInt(JSONForm1.formData.card_type) == 1 && cardIdNo != undefined && cardIdNo.length > 0 ){
			let birthday = "";
			//计算出生日期
      if (cardIdNo.length==18) {
        birthday = cardIdNo.substr(6,8);
				personJs.myVar3.birthday =  birthday.replace(/(.{4})(.{2})/,"$1-$2-");
      }else if(cardIdNo.length==15){
        birthday = "19"+cardIdNo.substr(6,6);
        personJs.myVar3.birthday = birthday.replace(/(.{4})(.{2})/,"$1-$2-");
      }else{
        personJs.myVar3.birthday = ''; 
      }
			//计算性别 1：男 2：女
			if (parseInt(cardIdNo.substr(16, 1)) % 2 == 1) 
      	personJs.myVar3.gather =  1;
     	else 
      	personJs.myVar3.gather = 2;
			
			//计算年龄
			var myDate = new Date();
			var month = myDate.getMonth() + 1;
			var day = myDate.getDate();
			var age = myDate.getFullYear() - cardIdNo.substring(6, 10) - 1;
			if (cardIdNo.substring(10, 12) < month || cardIdNo.substring(10, 12) == month && cardIdNo.substring(12, 14) <= day) 
				age++;
			personJs.myVar3.age = age;
			personJs.myVar3.currentDate = currentDateString;
			return personJs.myVar3;
		}
		else if(parseInt(JSONForm1.formData.card_type) != 1 && globalState.store.birthdayValue && globalState.store.birthdayValue != ""){
			let currentYear = new Date().getFullYear() //当前的年份
      let calculationYear = new Date(globalState.store.birthdayValue).getFullYear() //计算的年份
      const wholeTime = currentYear + globalState.store.birthdayValue.substring(4) //周岁时间
      const calculationAge = currentYear - calculationYear //按照年份计算的年龄
      //判断是否过了生日
      if (new Date().getTime() > new Date(wholeTime).getTime()){
        personJs.myVar3.age = calculationAge
      }else {
        personJs.myVar3.age = calculationAge - 1
      }
			return personJs.myVar3;
		}
		
		else{
			personJs.myVar3.currentDate = currentDateString;
			return {'currentDate':currentDateString };
		}
	},
	uuid: () => {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
},
	//移除已选的项目
	tableXqDeleteFun: async() => {
		//需要移除的项目
		var rDelete = await TableXq.selectedRow;
		let currZhxmList = await globalState.store.TableXq || [];
		let zhxmList = await currZhxmList.filter((f) => f.ID !== rDelete.ID);
		let countPrice =0.00;
		let projectIdList = zhxmList.map(function(value,index) {
			countPrice += parseFloat(parseFloat(value.BZJG) * value.ZK / 100);
			return value['ID'];
			
				});
		storeValue('countsjPrice',countPrice.toFixed(2),false);
		storeValue('regProjectIdList', '('+projectIdList.join(',')+')', false);
        await storeValue('TableXq', zhxmList, false);
	},
	xmSumPrice: () => {
		var sum =0;
		 Table3.tableData.reduce(function(el){
					sum += parseInt(el.BZJG);								
			})
		return parseFloat(sum).toFixed(2);
	},
	zkChange:()=>{
		let zk = Input2.text;
	
			let tjxm = globalState.store.TableXq;
		let result = [];
		let countPrice = 0.00;
		tjxm.forEach(function(item){
			item.ZK = parseInt(zk);
			countPrice += parseFloat(parseFloat(item.BZJG) * item.ZK / 100);
			result.push(item);
		})
		storeValue('TableXq',result,false);
		storeValue('countsjPrice',countPrice.toFixed(2),false);
	},
	tableXMPricechange:()=>{
		let result = globalState.store.TableXq;
		let changerows = Table3.operationalData;
		let countPrice = 0.00;
		result.forEach(function(item,index){
			if(item.ID == changerows.cell.row.data.ID && changerows.cell.row.data.index == index){
				item.ZK = changerows.item
				result[index]=item;
			}
			countPrice += parseFloat(parseFloat(item.BZJG) * item.ZK / 100);
		})
		storeValue('TableXq',result,false);
		storeValue('countsjPrice',countPrice.toFixed(2),false);
	},fromChangeVal:async () => {
		
		if(JSONForm1.activeField.label && JSONForm1.activeField.label == 'card_type'){
			storeValue('cardTyppe',JSONForm1.activeField.value,false);
		}
		if(JSONForm1.activeField.label && JSONForm1.activeField.label == 'ywlx'){
			storeValue('ywlxValue',JSONForm1.activeField.value,false);
			let sex = globalState.store.sexValue ? globalState.store.sexValue:"0,1,2"
			await storeValue('PERSIONSEX', "(0,"+sex+ ")and PHY_BUSINESS_TYPE_ID = "+JSONForm1.activeField.value,false);
			await tjtc.run();
			tjlb.run();
		}
		
		if(JSONForm1.activeField.label && JSONForm1.activeField.label == 'birthday'){
			storeValue('birthdayValue',JSONForm1.activeField.value,false);
			this.birthday()
		}
		if(JSONForm1.activeField.label && JSONForm1.activeField.label == 'sex'){
			console.log(JSONForm1.activeField.value);
			storeValue('sexValue',JSONForm1.activeField.value,false);
			let ywlxValue = globalState.store.ywlxValue ? "and PHY_BUSINESS_TYPE_ID = "+globalState.store.ywlxValue:""
			await storeValue('PERSIONSEX', "(0,"+JSONForm1.activeField.value+ ")"+ywlxValue,false);
			await tjtc.run()
		}
	
	}
}