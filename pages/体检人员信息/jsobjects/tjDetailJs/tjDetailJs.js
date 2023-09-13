export default {
	myVar1: {
		0:"未婚",1:"已婚",2:"未知"
	},
	myVar2: {
		0:"未缴费",1:"已缴费",2:"已退费",3:"申请退费中"
	},
	myVar3: {
		0:"未检查",1:"已检查",2:"弃检",3:"未保存"
	},
	
	updateForm: async () => {
		//使用 async-await or promises 语法
		await updateRegister2.run();
		await showAlert('更新成功');
		await closeModal('Modal1');
		await user_xx.run();
	},
	
	tfFun: async ()=>{
		const rows = await TablePersonXq.selectedRows || [];
		//let le = await rows.length;
		if(!rows.length || !Object.keys(rows[0] || {}).length){
			await showAlert('请选择退费项目！');
		}else{
			let newRows = await rows.filter(item=> item.PAY_STATUS !=='1' || item.CHECK_STATUS!=='0'?false:true);

			console.log(rows);
			if(newRows.length === 0 ){
				await showAlert('请选择可退费的项目！');
			}else{
				
				var str = await 'begin';
				var pe_id = await globalState.URL.queryParams.PE_ID;
				
				await newRows.forEach((item)=>{
					console.log(item);
					str += " UPDATE REG_ITEM_INFO SET DELETE_FLAG = 1  WHERE REG_ID ='"
					str += pe_id;
					str += "' and ITEM_ID ='"
					str += item.ZHXMID;
					str +=  "';";
				})
				 str+= await ' end;';
				await storeValue('__UPDATE_PACKS', str, false);
				await updatePacks.run();
				await storeValue('__UPDATE_PACKS', undefined, false);
				await showAlert('退费成功！');
			
				tjxm.run()
			
			}
		}
	},	
	
	// 获取PDF打印信息
	getNewPrintInfo: () => {
		closeModal('Modal2')
		return  {
			title: '紫薇市人民医院体检指引单', // 打印标题
			id: user_xx.data?.[0]?.['ID'], // 体检编号
			name: user_xx.data?.[0]?.['NAME'], // 姓名
			gender: user_xx.data?.[0]?.['GENDER'], //性别
			age: user_xx.data?.[0]?.['AGE'], // 年龄
			phone: user_xx.data?.[0]?.['PHONE'], // 电话
			plan: user_xx.data?.[0]?.['TJLX'], // 体检类型
			idCard: user_xx.data?.[0]?.['ID_CARD'], // 身份证号码
			belongs: user_xx.data?.[0]?.['YWLX'], // 单位
			regTime: user_xx.data?.[0]?.['REG_TIME'], // 注册时间
			examTerms: TablePersonXq.tableData.map((row, index) => ({
				id: index,
				termName: row['ZHMC'],
				termType: row['PHY_EXAM_TYPE'],
				tip: row['DEPT_REMARK'],
				address: row['DEPT_NAME'] + (row['DEPT_ADDRESS'] != null?row['DEPT_ADDRESS']:""),
				dataIndex: row['CHECK_DOCTOR']
			}))
		}
	},
	UPXMHIS:async()=>{
		let status = globalState.URL.queryParams.UPXM??0
		if(parseInt(status) === 1 ){
			showModal('Modal2');
		}
	},
}